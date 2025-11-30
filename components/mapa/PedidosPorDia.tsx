"use client";
import React, { useMemo } from 'react';
import { Envio } from "@/types/Envio";
import { FaBox, FaCalendarAlt, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';

type PedidosPorDiaProps = {
  envios: React.RefObject<Map<string, Envio>>;
  simulationTime: Date | null;
  startTime: Date;
  isOpen: boolean;
  onClose: () => void;
};

const PedidosPorDia: React.FC<PedidosPorDiaProps> = ({
  envios,
  simulationTime,
  startTime,
  isOpen,
  onClose
}) => {
  // Agrupar pedidos por día
  const pedidosPorDia = useMemo(() => {
    if (!envios.current || !simulationTime) return new Map<string, Envio[]>();

    const grupos = new Map<string, Envio[]>();
    const tiempoActual = simulationTime.getTime();

    envios.current.forEach((envio) => {
      const fechaEnvio = new Date(envio.fechaHoraSalida);

      // Solo incluir pedidos que ya han sido enviados (fecha <= tiempo actual de simulación)
      if (fechaEnvio.getTime() <= tiempoActual) {
        // Calcular días transcurridos desde el inicio
        const diasDesdeInicio = Math.floor((fechaEnvio.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24));
        const diaKey = `Día ${diasDesdeInicio + 1}`;

        if (!grupos.has(diaKey)) {
          grupos.set(diaKey, []);
        }
        grupos.get(diaKey)?.push(envio);
      }
    });

    // Ordenar los días de forma descendente (más reciente primero)
    return new Map([...grupos.entries()].sort((a, b) => {
      const diaA = parseInt(a[0].split(' ')[1]);
      const diaB = parseInt(b[0].split(' ')[1]);
      return diaB - diaA;
    }));
  }, [envios, simulationTime, startTime]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full bg-white shadow-2xl z-50 w-full max-w-md overflow-hidden">
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
            {pedidosPorDia.size === 0 ? (
              <div className="text-center py-12">
                <div className="bg-neutral-custom-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaBox className="text-4xl text-neutral-custom-400" />
                </div>
                <p className="text-neutral-custom-600 font-sans">
                  No hay pedidos registrados aún
                </p>
                <p className="text-neutral-custom-500 font-sans text-sm mt-2">
                  Los pedidos aparecerán conforme avance la simulación
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Array.from(pedidosPorDia.entries()).map(([dia, pedidos]) => (
                  <div key={dia} className="border-l-4 border-primary pl-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FaCalendarAlt className="text-primary" />
                      <h3 className="text-lg font-bold font-sans text-neutral-custom-800">
                        {dia}
                      </h3>
                      <span className="ml-auto bg-primary text-white px-2 py-1 rounded-full text-xs font-semibold">
                        {pedidos.length} {pedidos.length === 1 ? 'grupo' : 'grupos'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {pedidos.map((envio) => {
                        const fechaEnvio = new Date(envio.fechaHoraSalida);
                        const horaFormateada = fechaEnvio.toLocaleTimeString('es-PE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={envio.codigoEnvio}
                            className="bg-neutral-custom-50 rounded-lg p-4 hover:bg-neutral-custom-100 transition-colors duration-150"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FaBox className="text-primary text-sm" />
                                <p className="font-semibold font-sans text-neutral-custom-800 text-sm">
                                  {envio.codigoEnvio}
                                </p>
                              </div>
                              <span className="text-xs text-neutral-custom-600 font-mono">
                                {horaFormateada}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-neutral-custom-700">
                              <FaMapMarkerAlt className="text-neutral-custom-500 text-xs" />
                              <span className="font-sans">
                                {envio.origen} → {envio.destino}
                              </span>
                            </div>

                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs text-neutral-custom-600 font-sans">
                                {envio.cantidadPaquetes} {envio.cantidadPaquetes === 1 ? 'producto' : 'productos'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-neutral-custom-50 px-6 py-4 border-t border-neutral-custom-200">
            <p className="text-neutral-custom-600 font-sans text-sm text-center">
              Total de grupos: <span className="font-semibold text-neutral-custom-800">
                {Array.from(pedidosPorDia.values()).reduce((sum, pedidos) => sum + pedidos.length, 0)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PedidosPorDia;
