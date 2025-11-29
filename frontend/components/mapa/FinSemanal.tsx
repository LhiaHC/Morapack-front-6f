"use client";
import React, { useMemo, useState } from 'react';
import { Vuelo } from "@/types/Vuelo";
import { ProgramacionVuelo } from "@/types/ProgramacionVuelo";
import { FaPlane, FaCheckCircle, FaExclamationTriangle, FaTimes, FaFileAlt, FaFilePdf } from 'react-icons/fa';

type FinSemanalProps = {
  programacionVuelos: React.MutableRefObject<Map<string, ProgramacionVuelo>>;
  vuelos: React.RefObject<Map<number, { vuelo: Vuelo }>>;
  colapso: boolean;
};

const formatTime = (timeString: string) => {
  const date = new Date(timeString);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const FinSemanal: React.FC<FinSemanalProps> = ({ programacionVuelos, vuelos, colapso =false }) => {
  const [open, setOpen] = useState(true);
  const [showDetailedReport, setShowDetailedReport] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleViewReport = () => {
    setShowDetailedReport(true);
  };

  const handleBackToSummary = () => {
    setShowDetailedReport(false);
  };

  const rows = useMemo(() => {
    const allRows = Array.from(programacionVuelos.current.values())
      .map((programacion) => {
        if (!vuelos.current) return null;
        const vueloInfo = vuelos.current.get(programacion.idVuelo);
        if (!vueloInfo) return null;
        
        return {
          code: programacion.idVuelo,
          departure: formatTime(vueloInfo.vuelo.fechaHoraSalida),
          arrival: formatTime(vueloInfo.vuelo.fechaHoraLlegada),
          origin: vueloInfo.vuelo.origen,
          destination: vueloInfo.vuelo.destino,
          packages: programacion.cantPaquetes,
        };
      })
      .filter(row => row !== null);

    // Return only the last 300 items
    return allRows.slice(-300);
  }, [programacionVuelos, vuelos]);

  if (!open) return null;

  // Summary Modal (Primera pantalla)
  if (!showDetailedReport) {
    return (
      <>
        {/* Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          {/* Modal Resumen */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-r ${colapso ? 'from-error to-error-dark' : 'from-success to-success-dark'} px-8 py-6 relative`}>
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
                    {colapso ? '¡Simulación Terminada!' : '¡Simulación Completada!'}
                  </h2>
                  <p className="text-white/90 font-sans">
                    {colapso ? 'Se detectó un colapso en el sistema' : 'Planificación semanal ejecutada exitosamente'}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {colapso ? (
                <div className="space-y-4">
                  <div className="bg-error-light/10 border-l-4 border-error px-4 py-3 rounded">
                    <p className="text-error-dark font-semibold font-sans mb-2">
                      Estado del Sistema: Colapsado
                    </p>
                    <p className="text-neutral-custom-700 font-sans text-sm">
                      El sistema ha alcanzado su capacidad máxima y no puede procesar más vuelos. Se recomienda revisar la planificación y optimizar las rutas.
                    </p>
                  </div>

                  <div className="bg-neutral-custom-50 rounded-lg p-4">
                    <h3 className="font-semibold font-sans text-neutral-custom-800 mb-3">Resumen de la simulación:</h3>
                    <div className="space-y-2 text-sm font-sans text-neutral-custom-700">
                      <div className="flex justify-between">
                        <span>Total de vuelos procesados:</span>
                        <span className="font-semibold text-neutral-custom-800">{rows.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estado final:</span>
                        <span className="font-semibold text-error">Colapso detectado</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-success-light/10 border-l-4 border-success px-4 py-3 rounded">
                    <p className="text-success-dark font-semibold font-sans mb-2">
                      Estado del Sistema: Óptimo
                    </p>
                    <p className="text-neutral-custom-700 font-sans text-sm">
                      La planificación semanal se ha completado sin problemas. Todos los vuelos se han procesado correctamente.
                    </p>
                  </div>

                  <div className="bg-neutral-custom-50 rounded-lg p-4">
                    <h3 className="font-semibold font-sans text-neutral-custom-800 mb-3">Resumen de la simulación:</h3>
                    <div className="space-y-2 text-sm font-sans text-neutral-custom-700">
                      <div className="flex justify-between">
                        <span>Total de vuelos procesados:</span>
                        <span className="font-semibold text-neutral-custom-800">{rows.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estado final:</span>
                        <span className="font-semibold text-success">Completado exitosamente</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Info adicional */}
              <div className="mt-6 bg-info-light/10 border border-info-light rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FaFileAlt className="text-info text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-info-dark font-semibold font-sans text-sm mb-1">
                      Reporte detallado disponible
                    </p>
                    <p className="text-neutral-custom-600 font-sans text-xs">
                      Consulta el reporte completo con todos los vuelos de la planificación.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-neutral-custom-50 px-8 py-4 border-t border-neutral-custom-200 flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-neutral-custom-200 text-neutral-custom-700 rounded-lg font-semibold font-sans hover:bg-neutral-custom-300 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={handleViewReport}
                className="px-6 py-3 bg-primary text-white rounded-lg font-semibold font-sans hover:bg-primary-600 transition-colors shadow-sm flex items-center gap-2"
              >
                <FaFilePdf />
                Ver Reporte Detallado
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Detailed Report Modal (Segunda pantalla)
  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-600 px-8 py-6 relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              aria-label="Cerrar"
            >
              <FaTimes size={20} />
            </button>

            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full">
                <FaPlane className="text-white text-3xl" />
              </div>
              <div>
                <h2 className="text-3xl font-bold font-display text-white mb-1">
                  Reporte de Planificación Semanal
                </h2>
                <p className="text-primary-50 font-sans">
                  Últimos {rows.length} vuelos de la planificación
                </p>
              </div>
            </div>
          </div>

          {/* Alert de Colapso */}
          {colapso && (
            <div className="bg-error-light/10 border-l-4 border-error px-8 py-4 flex items-center gap-3">
              <FaExclamationTriangle className="text-error text-2xl flex-shrink-0" />
              <div>
                <p className="text-error-dark font-semibold font-sans text-lg">
                  ¡Colapso detectado!
                </p>
                <p className="text-error font-sans text-sm">
                  Se ha detectado un colapso en la planificación del sistema.
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {!colapso && (
            <div className="bg-success-light/10 border-l-4 border-success px-8 py-4 flex items-center gap-3">
              <FaCheckCircle className="text-success text-2xl flex-shrink-0" />
              <div>
                <p className="text-success-dark font-semibold font-sans text-lg">
                  Simulación completada exitosamente
                </p>
                <p className="text-success-dark font-sans text-sm">
                  La planificación semanal se ha ejecutado sin problemas.
                </p>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="flex-1 overflow-auto px-8 py-6">
            <div className="bg-neutral-custom-50 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="px-6 py-4 text-left font-semibold font-sans text-sm">Código vuelo</th>
                      <th className="px-6 py-4 text-left font-semibold font-sans text-sm">Hora salida</th>
                      <th className="px-6 py-4 text-left font-semibold font-sans text-sm">Hora llegada</th>
                      <th className="px-6 py-4 text-left font-semibold font-sans text-sm">Ciudad origen</th>
                      <th className="px-6 py-4 text-left font-semibold font-sans text-sm">Ciudad destino</th>
                      <th className="px-6 py-4 text-left font-semibold font-sans text-sm">Paquetes asignados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      row && (
                        <tr
                          key={index}
                          className={`border-b border-neutral-custom-200 hover:bg-primary-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-neutral-custom-50'
                          }`}
                        >
                          <td className="px-6 py-4 font-medium font-sans text-neutral-custom-800">{row.code}</td>
                          <td className="px-6 py-4 font-sans text-neutral-custom-700">{row.departure}</td>
                          <td className="px-6 py-4 font-sans text-neutral-custom-700">{row.arrival}</td>
                          <td className="px-6 py-4 font-mono text-sm text-neutral-custom-700">{row.origin}</td>
                          <td className="px-6 py-4 font-mono text-sm text-neutral-custom-700">{row.destination}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center justify-center bg-primary-50 text-primary font-semibold px-3 py-1 rounded-full text-sm">
                              {row.packages}
                            </span>
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-neutral-custom-50 px-8 py-4 border-t border-neutral-custom-200 flex justify-between items-center">
            <p className="text-neutral-custom-600 font-sans text-sm">
              Total de vuelos mostrados: <span className="font-semibold text-neutral-custom-800">{rows.length}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleBackToSummary}
                className="px-6 py-3 bg-neutral-custom-200 text-neutral-custom-700 rounded-lg font-semibold font-sans hover:bg-neutral-custom-300 transition-colors"
              >
                Volver al Resumen
              </button>
              {/* <button className="px-6 py-3 bg-success text-white rounded-lg font-semibold font-sans hover:bg-success-dark transition-colors shadow-sm flex items-center gap-2">
                <FaDownload />
                Descargar PDF
              </button> */}
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-primary text-white rounded-lg font-semibold font-sans hover:bg-primary-600 transition-colors shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FinSemanal;