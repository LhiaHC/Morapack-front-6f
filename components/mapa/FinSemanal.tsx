"use client";
import React, { useMemo, useState } from 'react';
import { Vuelo } from "@/types/Vuelo";
import { ProgramacionVuelo } from "@/types/ProgramacionVuelo";
import { FaPlane, FaCheckCircle, FaExclamationTriangle, FaTimes, FaFileAlt, FaCalendar, FaBox, FaRoute, FaPercentage, FaClock, FaFire, FaWarehouse, FaChartLine } from 'react-icons/fa';

type FinSemanalProps = {
  programacionVuelos: React.MutableRefObject<Map<string, ProgramacionVuelo>>;
  vuelos: React.RefObject<Map<number, { vuelo: Vuelo }>>;
  colapso: boolean;
};

const FinSemanal: React.FC<FinSemanalProps> = ({ programacionVuelos, vuelos, colapso = false }) => {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
  };

  // Cálculos y estadísticas
  const stats = useMemo(() => {
    const allData = Array.from(programacionVuelos.current.values());
    
    let totalVuelos = 0;
    let totalPaquetes = 0;
    let capacidadTotal = 0;
    let vuelosExcedidos = 0;
    let momentoColapso: { dia: number; hora: string } | null = null;
    let primerVueloExcedido: ProgramacionVuelo | null = null;
    const vuelosPorDia: { [key: number]: number } = {};
    const paquetesPorDia: { [key: number]: number } = {};
    const rutasMasUsadas: { [key: string]: number } = {};
    const rutasCriticas: { [key: string]: { excedidos: number; total: number; excesoProm: number } } = {};
    const aeropuertosAfectados: { [key: string]: number } = {};
    let excesoPaquetesTotal = 0;
    
    allData.forEach((programacion) => {
      if (!vuelos.current) return;
      const vueloInfo = vuelos.current.get(programacion.idVuelo);
      if (!vueloInfo) return;
      
      totalVuelos++;
      totalPaquetes += programacion.cantPaquetes;
      capacidadTotal += vueloInfo.vuelo.capacidad;
      
      const excedido = programacion.cantPaquetes > vueloInfo.vuelo.capacidad;
      
      if (excedido) {
        vuelosExcedidos++;
        const exceso = programacion.cantPaquetes - vueloInfo.vuelo.capacidad;
        excesoPaquetesTotal += exceso;
        
        // Detectar primer vuelo excedido (momento del colapso)
        if (!primerVueloExcedido) {
          primerVueloExcedido = programacion;
          const fechaColapso = new Date(programacion.fechaSalida);
          momentoColapso = {
            dia: fechaColapso.getDate(),
            hora: fechaColapso.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
          };
        }
        
        // Rutas críticas (con problemas)
        const ruta = `${vueloInfo.vuelo.origen}→${vueloInfo.vuelo.destino}`;
        if (!rutasCriticas[ruta]) {
          rutasCriticas[ruta] = { excedidos: 0, total: 0, excesoProm: 0 };
        }
        rutasCriticas[ruta].excedidos++;
        rutasCriticas[ruta].excesoProm += exceso;
        
        // Aeropuertos con más problemas
        aeropuertosAfectados[vueloInfo.vuelo.origen] = (aeropuertosAfectados[vueloInfo.vuelo.origen] || 0) + 1;
        aeropuertosAfectados[vueloInfo.vuelo.destino] = (aeropuertosAfectados[vueloInfo.vuelo.destino] || 0) + 1;
      }
      
      // Contar vuelos por día
      const fechaSalida = new Date(programacion.fechaSalida);
      const dia = fechaSalida.getDate();
      vuelosPorDia[dia] = (vuelosPorDia[dia] || 0) + 1;
      paquetesPorDia[dia] = (paquetesPorDia[dia] || 0) + programacion.cantPaquetes;
      
      // Rutas más usadas
      const ruta = `${vueloInfo.vuelo.origen}-${vueloInfo.vuelo.destino}`;
      rutasMasUsadas[ruta] = (rutasMasUsadas[ruta] || 0) + 1;
      
      // Completar info de rutas críticas
      const rutaKey = `${vueloInfo.vuelo.origen}→${vueloInfo.vuelo.destino}`;
      if (rutasCriticas[rutaKey]) {
        rutasCriticas[rutaKey].total++;
      }
    });
    
    // Calcular exceso promedio por ruta crítica
    Object.keys(rutasCriticas).forEach(ruta => {
      if (rutasCriticas[ruta].excedidos > 0) {
        rutasCriticas[ruta].excesoProm = Math.round(rutasCriticas[ruta].excesoProm / rutasCriticas[ruta].excedidos);
      }
    });
    
    const topRutas = Object.entries(rutasMasUsadas)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    const topRutasCriticas = Object.entries(rutasCriticas)
      .sort(([, a], [, b]) => b.excedidos - a.excedidos)
      .slice(0, 3);
    
    const topAeropuertosAfectados = Object.entries(aeropuertosAfectados)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    const promedioOcupacion = capacidadTotal > 0 ? (totalPaquetes / capacidadTotal) * 100 : 0;
    const promedioExceso = vuelosExcedidos > 0 ? (excesoPaquetesTotal / vuelosExcedidos / (capacidadTotal / totalVuelos)) * 100 : 0;
    
    return {
      totalVuelos,
      totalPaquetes,
      capacidadTotal,
      vuelosExcedidos,
      promedioOcupacion,
      vuelosPorDia,
      paquetesPorDia,
      topRutas,
      // Datos específicos para colapso
      momentoColapso,
      excesoPaquetesTotal,
      promedioExceso,
      topRutasCriticas,
      topAeropuertosAfectados,
      porcentajeVuelosExcedidos: totalVuelos > 0 ? (vuelosExcedidos / totalVuelos) * 100 : 0,
    };
  }, [programacionVuelos, vuelos]);

  if (!open) return null;

  // REPORTE ESPECIAL PARA COLAPSO
  if (colapso) {
    return (
      <>
        {/* Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          {/* Modal */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6 relative">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                aria-label="Cerrar"
              >
                <FaTimes size={20} />
              </button>

              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-4 rounded-full animate-pulse">
                  <FaExclamationTriangle className="text-white text-4xl" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold font-display text-white mb-1">
                    🔴 Análisis de Colapso del Sistema
                  </h2>
                  <p className="text-red-100 font-sans">
                    Diagnóstico detallado de las causas del fallo
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {/* Alerta Principal */}
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <FaFire className="text-red-600 text-2xl" />
                  <h3 className="text-xl font-bold text-red-900">¡Sistema Colapsado!</h3>
                </div>
                <p className="text-red-800 text-sm mb-2">
                  El sistema no pudo completar la planificación semanal debido a sobrecarga operacional.
                </p>
                {stats.momentoColapso && (
                  <div className="bg-white rounded-lg p-3 mt-3 border border-red-200">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-red-600" />
                      <span className="font-semibold text-red-900">Momento del colapso:</span>
                      <span className="text-red-700">Día {stats.momentoColapso.dia} a las {stats.momentoColapso.hora}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* KPIs Críticos de Colapso */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Vuelos Excedidos */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border-2 border-red-300">
                  <div className="flex items-center justify-between mb-2">
                    <FaExclamationTriangle className="text-red-600 text-2xl" />
                    <span className="text-xs font-semibold text-red-600 bg-red-200 px-2 py-1 rounded-full">CRÍTICO</span>
                  </div>
                  <p className="text-4xl font-bold text-red-900 mb-1">{stats.vuelosExcedidos}</p>
                  <p className="text-sm text-red-700 font-medium">Vuelos excedidos</p>
                  <p className="text-xs text-red-600 mt-1">({stats.porcentajeVuelosExcedidos.toFixed(1)}% del total)</p>
                </div>

                {/* Exceso Promedio */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border-2 border-orange-300">
                  <div className="flex items-center justify-between mb-2">
                    <FaChartLine className="text-orange-600 text-2xl" />
                    <span className="text-xs font-semibold text-orange-600 bg-orange-200 px-2 py-1 rounded-full">EXCESO</span>
                  </div>
                  <p className="text-4xl font-bold text-orange-900 mb-1">+{stats.promedioExceso.toFixed(0)}%</p>
                  <p className="text-sm text-orange-700 font-medium">Exceso promedio</p>
                  <p className="text-xs text-orange-600 mt-1">sobre capacidad</p>
                </div>

                {/* Paquetes sin Procesar */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border-2 border-yellow-300">
                  <div className="flex items-center justify-between mb-2">
                    <FaBox className="text-yellow-600 text-2xl" />
                    <span className="text-xs font-semibold text-yellow-600 bg-yellow-200 px-2 py-1 rounded-full">SIN ASIGNAR</span>
                  </div>
                  <p className="text-4xl font-bold text-yellow-900 mb-1">{stats.excesoPaquetesTotal.toLocaleString()}</p>
                  <p className="text-sm text-yellow-700 font-medium">Paquetes excedentes</p>
                  <p className="text-xs text-yellow-600 mt-1">no pudieron asignarse</p>
                </div>

                {/* Vuelos Procesados */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-300">
                  <div className="flex items-center justify-between mb-2">
                    <FaPlane className="text-gray-600 text-2xl" />
                    <span className="text-xs font-semibold text-gray-600 bg-gray-200 px-2 py-1 rounded-full">PROCESADOS</span>
                  </div>
                  <p className="text-4xl font-bold text-gray-900 mb-1">{stats.totalVuelos}</p>
                  <p className="text-sm text-gray-700 font-medium">Vuelos antes del fallo</p>
                </div>
              </div>

              {/* Análisis de Causa Raíz */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Rutas Críticas */}
                <div className="bg-white rounded-xl border-2 border-red-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FaRoute className="text-red-600 text-xl" />
                    <h3 className="text-lg font-bold text-gray-800">Rutas Críticas (Causantes)</h3>
                  </div>
                  <div className="space-y-3">
                    {stats.topRutasCriticas.length > 0 ? (
                      stats.topRutasCriticas.map(([ruta, info], index) => (
                        <div key={ruta} className="bg-red-50 rounded-lg p-4 border border-red-200">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-white text-sm bg-red-600">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-mono font-bold text-red-900 mb-1">{ruta}</p>
                              <div className="flex gap-4 text-xs text-red-700">
                                <span><span className="font-semibold">{info.excedidos}</span> vuelos excedidos</span>
                                <span>Exceso prom: <span className="font-semibold">+{info.excesoProm}</span> paq.</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">No se detectaron rutas críticas</p>
                    )}
                  </div>
                </div>

                {/* Aeropuertos Afectados */}
                <div className="bg-white rounded-xl border-2 border-orange-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FaWarehouse className="text-orange-600 text-xl" />
                    <h3 className="text-lg font-bold text-gray-800">Aeropuertos Más Afectados</h3>
                  </div>
                  <div className="space-y-2">
                    {stats.topAeropuertosAfectados.length > 0 ? (
                      stats.topAeropuertosAfectados.map(([aeropuerto, cantidad], index) => (
                        <div key={aeropuerto} className="flex items-center gap-3 bg-orange-50 rounded-lg p-3 border border-orange-200">
                          <div className={`flex items-center justify-center w-7 h-7 rounded-full font-bold text-white text-xs ${
                            index === 0 ? 'bg-orange-600' :
                            index === 1 ? 'bg-orange-500' :
                            'bg-orange-400'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-mono font-semibold text-orange-900">{aeropuerto}</p>
                          </div>
                          <span className="text-orange-700 font-bold text-sm">{cantidad} incidentes</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">No se detectaron aeropuertos afectados</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recomendaciones */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border-2 border-blue-300 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 p-3 rounded-full">
                    <FaFileAlt className="text-white text-2xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-blue-900 mb-3">💡 Recomendaciones para Prevenir Colapsos</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                      {stats.topRutasCriticas.length > 0 && (
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span><span className="font-semibold">Aumentar capacidad:</span> Agregar más vuelos en las rutas críticas identificadas ({stats.topRutasCriticas.map(([r]) => r).join(', ')})</span>
                        </li>
                      )}
                      {stats.topAeropuertosAfectados.length > 0 && (
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span><span className="font-semibold">Reforzar hubs:</span> Incrementar capacidad de almacenamiento en {stats.topAeropuertosAfectados[0][0]} y otros aeropuertos saturados</span>
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span><span className="font-semibold">Diversificar rutas:</span> Establecer rutas alternativas para distribuir la carga operacional</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span><span className="font-semibold">Optimizar programación:</span> Redistribuir vuelos a lo largo del día para evitar picos de demanda</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaExclamationTriangle className="text-red-500" />
                <span className="font-semibold">Análisis de colapso generado automáticamente</span>
              </div>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold font-sans hover:bg-red-700 transition-colors shadow-sm"
              >
                Cerrar Análisis
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // REPORTE NORMAL PARA ÉXITO
  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${colapso ? 'from-error to-error-dark' : 'from-primary to-primary-600'} px-8 py-6 relative`}>
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              aria-label="Cerrar"
            >
              <FaTimes size={20} />
            </button>

            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-full">
                {colapso ? (
                  <FaExclamationTriangle className="text-white text-4xl" />
                ) : (
                  <FaCheckCircle className="text-white text-4xl" />
                )}
              </div>
              <div>
                <h2 className="text-3xl font-bold font-display text-white mb-1">
                  Reporte de Simulación Semanal
                </h2>
                <p className="text-white/90 font-sans">
                  {colapso ? 'Sistema colapsado - Revisión requerida' : 'Planificación completada exitosamente'}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Total Vuelos */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <FaPlane className="text-blue-600 text-2xl" />
                  <span className="text-xs font-semibold text-blue-600 bg-blue-200 px-2 py-1 rounded-full">VUELOS</span>
                </div>
                <p className="text-4xl font-bold text-blue-900 mb-1">{stats.totalVuelos}</p>
                <p className="text-sm text-blue-700 font-medium">Vuelos ejecutados</p>
              </div>

              {/* Total Paquetes */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <FaBox className="text-green-600 text-2xl" />
                  <span className="text-xs font-semibold text-green-600 bg-green-200 px-2 py-1 rounded-full">PAQUETES</span>
                </div>
                <p className="text-4xl font-bold text-green-900 mb-1">{stats.totalPaquetes.toLocaleString()}</p>
                <p className="text-sm text-green-700 font-medium">Paquetes transportados</p>
              </div>

              {/* Promedio de Ocupación */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <FaPercentage className="text-purple-600 text-2xl" />
                  <span className="text-xs font-semibold text-purple-600 bg-purple-200 px-2 py-1 rounded-full">OCUPACIÓN</span>
                </div>
                <p className="text-4xl font-bold text-purple-900 mb-1">{stats.promedioOcupacion.toFixed(1)}%</p>
                <p className="text-sm text-purple-700 font-medium">Promedio de ocupación</p>
              </div>

              {/* Vuelos Excedidos */}
              <div className={`bg-gradient-to-br ${stats.vuelosExcedidos > 0 ? 'from-red-50 to-red-100 border-red-200' : 'from-gray-50 to-gray-100 border-gray-200'} rounded-xl p-5 border`}>
                <div className="flex items-center justify-between mb-2">
                  <FaExclamationTriangle className={`${stats.vuelosExcedidos > 0 ? 'text-red-600' : 'text-gray-400'} text-2xl`} />
                  <span className={`text-xs font-semibold ${stats.vuelosExcedidos > 0 ? 'text-red-600 bg-red-200' : 'text-gray-500 bg-gray-200'} px-2 py-1 rounded-full`}>ALERTAS</span>
                </div>
                <p className={`text-4xl font-bold ${stats.vuelosExcedidos > 0 ? 'text-red-900' : 'text-gray-400'} mb-1`}>{stats.vuelosExcedidos}</p>
                <p className={`text-sm ${stats.vuelosExcedidos > 0 ? 'text-red-700' : 'text-gray-500'} font-medium`}>Vuelos excedidos</p>
              </div>
            </div>

            {/* Sección de Distribución */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Vuelos por Día */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaCalendar className="text-primary text-xl" />
                  <h3 className="text-lg font-bold text-gray-800">Distribución por Día</h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(stats.vuelosPorDia)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([dia, cantidad]) => {
                      const maxVuelos = Math.max(...Object.values(stats.vuelosPorDia));
                      const porcentaje = (cantidad / maxVuelos) * 100;
                      return (
                        <div key={dia} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-semibold text-gray-700">Día {dia}</span>
                            <span className="text-gray-600">{cantidad} vuelos | {stats.paquetesPorDia[Number(dia)]} paquetes</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-primary rounded-full h-3 transition-all duration-500"
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Top 5 Rutas */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaRoute className="text-primary text-xl" />
                  <h3 className="text-lg font-bold text-gray-800">Top 5 Rutas Más Usadas</h3>
                </div>
                <div className="space-y-3">
                  {stats.topRutas.map(([ruta, cantidad], index) => (
                    <div key={ruta} className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-white text-sm ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-400' :
                        'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-mono font-semibold text-gray-800">{ruta}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary-50 text-primary">
                          {cantidad} vuelos
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumen Final */}
            <div className={`rounded-xl border-2 p-6 ${colapso ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
              <div className="flex items-start gap-4">
                {colapso ? (
                  <FaExclamationTriangle className="text-red-600 text-3xl flex-shrink-0 mt-1" />
                ) : (
                  <FaCheckCircle className="text-green-600 text-3xl flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 ${colapso ? 'text-red-800' : 'text-green-800'}`}>
                    {colapso ? 'Simulación Interrumpida por Colapso' : 'Simulación Completada Exitosamente'}
                  </h3>
                  <p className={`text-sm mb-4 ${colapso ? 'text-red-700' : 'text-green-700'}`}>
                    {colapso
                      ? `El sistema colapsó después de procesar ${stats.totalVuelos} vuelos. ${stats.vuelosExcedidos} vuelos excedieron su capacidad máxima. Se recomienda revisar y optimizar la planificación.`
                      : `La planificación semanal se ejecutó correctamente con ${stats.totalVuelos} vuelos y ${stats.totalPaquetes.toLocaleString()} paquetes transportados. El sistema operó con una ocupación promedio del ${stats.promedioOcupacion.toFixed(1)}%.`
                    }
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className={`${colapso ? 'text-red-700' : 'text-green-700'}`}>
                      <span className="font-semibold">Duración:</span> 7 días
                    </div>
                    <div className={`${colapso ? 'text-red-700' : 'text-green-700'}`}>
                      <span className="font-semibold">Capacidad:</span> {stats.capacidadTotal.toLocaleString()}
                    </div>
                    <div className={`${colapso ? 'text-red-700' : 'text-green-700'}`}>
                      <span className="font-semibold">Eficiencia:</span> {stats.promedioOcupacion.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaFileAlt className="text-gray-400" />
              <span>Reporte generado automáticamente</span>
            </div>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold font-sans hover:bg-primary-600 transition-colors shadow-sm"
            >
              Cerrar Reporte
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FinSemanal;