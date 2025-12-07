"use client";
import React, { useMemo, useState } from 'react';
import { Envio } from "@/types/Envio";
import { Vuelo } from "@/types/Vuelo";
import { ProgramacionVuelo } from "@/types/ProgramacionVuelo";
import { Paquete } from "@/types/Paquete";
import { FaBox, FaCalendarAlt, FaMapMarkerAlt, FaTimes, FaPlane, FaChevronDown, FaChevronRight, FaRoute } from 'react-icons/fa';

type PedidosPorDiaProps = {
  envios: React.RefObject<Map<string, Envio>>;
  vuelos: React.RefObject<Map<number, { vuelo: Vuelo; pointFeature: any; lineFeature: any; routeFeature: any }>>;
  programacionVuelos: React.RefObject<Map<string, ProgramacionVuelo>>;
  simulationTime: Date | null;
  startTime: Date;
  isOpen: boolean;
  onClose: () => void;
};

const PedidosPorDia: React.FC<PedidosPorDiaProps> = ({
  envios,
  vuelos,
  programacionVuelos,
  simulationTime,
  startTime,
  isOpen,
  onClose
}) => {
  const [expandedEnvio, setExpandedEnvio] = useState<string | null>(null);
  const [expandedVuelo, setExpandedVuelo] = useState<number | null>(null);

  // Obtener el día actual de la simulación
  const diaActual = useMemo(() => {
    if (!simulationTime || !startTime) return 0;
    return Math.floor((simulationTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [simulationTime, startTime]);

  // Agrupar pedidos del día actual por vuelo
  const vuelosDelDia = useMemo(() => {
    if (!programacionVuelos.current || !vuelos.current || !simulationTime) return [];

    const vuelosAgrupados: Array<{
      idVuelo: number;
      vuelo: Vuelo;
      programacion: ProgramacionVuelo;
      enviosPorCodigo: Map<string, { envio: Envio; paquetes: Paquete[] }>;
    }> = [];

    // Iterar sobre las programaciones de vuelos
    programacionVuelos.current.forEach((programacion, key) => {
      const fechaProgramacion = new Date(programacion.fechaSalida);
      const diaVuelo = Math.floor((fechaProgramacion.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Solo incluir vuelos del día actual
      if (diaVuelo === diaActual && programacion.paquetes.length > 0) {
        const vueloInfo = vuelos.current?.get(programacion.idVuelo);
        if (vueloInfo) {
          // Agrupar paquetes por código de envío
          const enviosPorCodigo = new Map<string, { envio: Envio; paquetes: Paquete[] }>();
          
          programacion.paquetes.forEach((paquete) => {
            const envio = envios.current?.get(paquete.codigoEnvio);
            if (envio) {
              if (!enviosPorCodigo.has(paquete.codigoEnvio)) {
                enviosPorCodigo.set(paquete.codigoEnvio, {
                  envio,
                  paquetes: []
                });
              }
              enviosPorCodigo.get(paquete.codigoEnvio)?.paquetes.push(paquete);
            }
          });

          vuelosAgrupados.push({
            idVuelo: programacion.idVuelo,
            vuelo: vueloInfo.vuelo,
            programacion,
            enviosPorCodigo
          });
        }
      }
    });

    return vuelosAgrupados.sort((a, b) => {
      const fechaA = new Date(a.programacion.fechaSalida).getTime();
      const fechaB = new Date(b.programacion.fechaSalida).getTime();
      return fechaA - fechaB;
    });
  }, [programacionVuelos, vuelos, envios, simulationTime, startTime, diaActual]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[80]"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full bg-white shadow-2xl z-[80] w-full max-w-md overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-600 text-white p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors duration-200"
              aria-label="Cerrar"
            >
              <FaTimes size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full">
                <FaCalendarAlt className="text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display">Pedidos por Día</h2>
                <p className="text-primary-50 font-sans text-sm mt-1">
                  Historial de grupos de productos
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {vuelosDelDia.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-neutral-custom-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCalendarAlt className="text-4xl text-neutral-custom-400" />
                </div>
                <p className="text-neutral-custom-600 font-sans">
                  No hay vuelos programados para el Día {diaActual}
                </p>
                <p className="text-neutral-custom-500 font-sans text-sm mt-2">
                  Los vuelos aparecerán conforme avance la simulación
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-primary-50 rounded-lg p-3 mb-4">
                  <p className="text-primary-900 font-semibold text-center">
                    Día {diaActual} - {vuelosDelDia.length} {vuelosDelDia.length === 1 ? 'vuelo' : 'vuelos'}
                  </p>
                </div>

                {vuelosDelDia.map(({ idVuelo, vuelo, programacion, enviosPorCodigo }) => {
                  const fechaSalida = new Date(programacion.fechaSalida);
                  const horaSalida = new Date(vuelo.fechaHoraSalida);
                  fechaSalida.setHours(horaSalida.getHours(), horaSalida.getMinutes(), 0, 0);
                  
                  const horaFormateada = fechaSalida.toLocaleTimeString('es-PE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const totalEnvios = enviosPorCodigo.size;
                  const totalPaquetes = programacion.cantPaquetes;

                  return (
                    <div
                      key={idVuelo}
                      className="bg-white rounded-lg shadow-md border border-neutral-custom-200 overflow-hidden"
                    >
                      {/* Cabecera del vuelo */}
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-full">
                              <FaPlane className="text-xl" />
                            </div>
                            <div>
                              <p className="font-bold text-lg">Vuelo #{idVuelo}</p>
                              <p className="text-blue-100 text-sm">{horaFormateada}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-blue-100">
                              {vuelo.origen} → {vuelo.destino}
                            </p>
                            <p className="text-xs text-blue-200 mt-1">
                              {totalPaquetes} paquetes • {totalEnvios} {totalEnvios === 1 ? 'envío' : 'envíos'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Lista de envíos en este vuelo */}
                      <div className="p-4 space-y-2">
                        {Array.from(enviosPorCodigo.entries()).map(([codigoEnvio, { envio, paquetes }]) => {
                          const isExpanded = expandedEnvio === codigoEnvio;
                          
                          return (
                            <div key={codigoEnvio} className="border border-neutral-custom-200 rounded-lg overflow-hidden">
                              {/* Cabecera del envío - clickeable */}
                              <button
                                onClick={() => setExpandedEnvio(isExpanded ? null : codigoEnvio)}
                                className="w-full bg-neutral-custom-50 hover:bg-neutral-custom-100 p-3 transition-colors duration-150"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? <FaChevronDown className="text-primary" /> : <FaChevronRight className="text-neutral-custom-400" />}
                                    <FaBox className="text-primary text-sm" />
                                    <span className="font-semibold text-neutral-custom-800 text-sm">
                                      {codigoEnvio}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-neutral-custom-600">
                                      <FaMapMarkerAlt className="inline mr-1" />
                                      {envio.origen} → {envio.destino}
                                    </span>
                                    <span className="bg-primary text-white px-2 py-1 rounded-full text-xs font-semibold">
                                      {paquetes.length} {paquetes.length === 1 ? 'paquete' : 'paquetes'}
                                    </span>
                                  </div>
                                </div>
                              </button>

                              {/* Detalles de los paquetes y sus tramos */}
                              {isExpanded && (
                                <div className="p-3 bg-white border-t border-neutral-custom-200 space-y-3">
                                  {paquetes.map((paquete, idx) => (
                                    <div key={paquete.id} className="bg-neutral-custom-50 rounded p-3">
                                      <div className="flex items-start justify-between mb-2">
                                        <p className="text-sm font-semibold text-neutral-custom-800">
                                          Paquete #{idx + 1}
                                        </p>
                                        <span className={`text-xs px-2 py-1 rounded ${
                                          paquete.llegoDestino 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-blue-100 text-blue-800'
                                        }`}>
                                          {paquete.llegoDestino ? 'Entregado' : 'En tránsito'}
                                        </span>
                                      </div>
                                      
                                      {/* Mostrar la ruta del paquete */}
                                      {paquete.ruta && paquete.ruta.length > 0 && (
                                        <div className="mt-2">
                                          <div className="flex items-center gap-2 mb-2">
                                            <FaRoute className="text-primary text-xs" />
                                            <span className="text-xs font-semibold text-neutral-custom-700">
                                              Ruta (Vuelos):
                                            </span>
                                          </div>
                                          <div className="flex flex-wrap gap-1">
                                            {paquete.ruta.map((vueloId, index) => {
                                              const vueloRuta = vuelos.current?.get(vueloId);
                                              return (
                                                <React.Fragment key={index}>
                                                  <span className={`text-xs px-2 py-1 rounded ${
                                                    vueloId === idVuelo 
                                                      ? 'bg-primary text-white font-semibold' 
                                                      : 'bg-neutral-custom-200 text-neutral-custom-700'
                                                  }`}>
                                                    {vueloRuta ? `${vueloRuta.vuelo.origen}→${vueloRuta.vuelo.destino}` : `V${vueloId}`}
                                                  </span>
                                                  {index < paquete.ruta.length - 1 && (
                                                    <span className="text-neutral-custom-400 text-xs">→</span>
                                                  )}
                                                </React.Fragment>
                                              );
                                            })}
                                          </div>
                                          {paquete.ruta.length > 1 && (
                                            <p className="text-xs text-neutral-custom-500 mt-2 italic">
                                              Este paquete requiere {paquete.ruta.length} tramos para llegar a su destino
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-neutral-custom-50 px-6 py-4 border-t border-neutral-custom-200">
            <p className="text-neutral-custom-600 font-sans text-sm text-center">
              Día {diaActual}: <span className="font-semibold text-neutral-custom-800">
                {vuelosDelDia.reduce((sum, v) => sum + v.enviosPorCodigo.size, 0)} envíos
              </span> en <span className="font-semibold text-neutral-custom-800">
                {vuelosDelDia.length} {vuelosDelDia.length === 1 ? 'vuelo' : 'vuelos'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PedidosPorDia;
