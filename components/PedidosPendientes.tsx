"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaBox, FaPlane, FaClock } from 'react-icons/fa';

interface EnvioPendiente {
  id: number;
  fechaHoraSalida: string;
  cantidadPaquetes: number;
  origen: string;
  destino: string;
  emisorID: number;
  receptorID: number;
}

interface PedidosPendientesProps {
  apiURL: string;
}

const PedidosPendientes: React.FC<PedidosPendientesProps> = ({ apiURL }) => {
  const [enviosPendientes, setEnviosPendientes] = useState<EnvioPendiente[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchEnviosPendientes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiURL}/envio`);
      // Filtrar solo los envíos que no tienen asignación de vuelo aún
      const pendientes = response.data.filter((envio: any) => !envio.vueloAsignado);
      setEnviosPendientes(pendientes);
    } catch (error) {
      console.error("Error al obtener envíos pendientes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEnviosPendientes();
      // Actualizar cada 10 segundos
      const interval = setInterval(fetchEnviosPendientes, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-40 right-6 z-[85] ${
          enviosPendientes.length > 0 ? 'bg-yellow-500 hover:bg-yellow-600 animate-pulse' : 'bg-gray-400 hover:bg-gray-500'
        } text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110`}
        title="Pedidos pendientes de planificación"
      >
        <div className="relative">
          <FaBox className="w-6 h-6" />
          {enviosPendientes.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
              {enviosPendientes.length}
            </span>
          )}
        </div>
      </button>

      {/* Panel lateral */}
      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-[90] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Pedidos Pendientes</h2>
                <p className="text-sm text-yellow-100 mt-1">
                  Esperando planificación de vuelo
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm bg-white/20 rounded-lg px-3 py-2">
              <FaClock className="w-4 h-4" />
              <span>Total: {enviosPendientes.length} {enviosPendientes.length === 1 ? 'pedido' : 'pedidos'}</span>
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
              </div>
            ) : enviosPendientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-center font-semibold">No hay pedidos pendientes</p>
                <p className="text-center text-sm mt-2">Todos los envíos están planificados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {enviosPendientes.map((envio) => (
                  <div
                    key={envio.id}
                    className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                  >
                    {/* Header del envío */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-yellow-500 text-white rounded-full p-2">
                          <FaBox className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-yellow-700">PEDIDO #{envio.id}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <FaClock className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-600">
                              {new Date(envio.fechaHoraSalida).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ruta */}
                    <div className="bg-white rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                          <div className="text-xs text-gray-500 mb-1">Origen</div>
                          <div className="font-bold text-lg text-gray-800">{envio.origen}</div>
                        </div>
                        <div className="px-3">
                          <FaPlane className="w-5 h-5 text-yellow-500 transform rotate-90" />
                        </div>
                        <div className="text-center flex-1">
                          <div className="text-xs text-gray-500 mb-1">Destino</div>
                          <div className="font-bold text-lg text-gray-800">{envio.destino}</div>
                        </div>
                      </div>
                    </div>

                    {/* Paquetes */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="bg-yellow-100 rounded-lg px-3 py-2 flex items-center gap-2 flex-1">
                        <FaBox className="w-4 h-4 text-yellow-600" />
                        <span className="font-semibold text-yellow-800">
                          {envio.cantidadPaquetes} {envio.cantidadPaquetes === 1 ? 'paquete' : 'paquetes'}
                        </span>
                      </div>
                    </div>

                    {/* Estado */}
                    <div className="mt-3 pt-3 border-t border-yellow-200">
                      <div className="flex items-center gap-2 text-xs text-yellow-700">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="font-semibold">Esperando planificación de vuelo</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={fetchEnviosPendientes}
              className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PedidosPendientes;
