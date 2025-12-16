"use client";
import React, { useState } from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const FinColapso: React.FC = () => {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn">
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
                  Colapso del Sistema Detectado
                </h2>
                <p className="text-red-100 font-sans">
                  La red logística ha alcanzado su capacidad máxima
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            <div className="space-y-6">
              {/* Explicación del colapso */}
              <div className="bg-red-50 border-l-4 border-red-600 rounded-lg p-6">
                <h3 className="text-xl font-bold text-red-900 mb-3 flex items-center gap-2">
                  <FaExclamationTriangle className="text-red-600" />
                  Situación Crítica
                </h3>
                <p className="text-gray-800 leading-relaxed mb-4">
                  El sistema de distribución ha experimentado un <strong>colapso operativo</strong> debido a la
                  acumulación progresiva de paquetes que excedió la capacidad de procesamiento de la red.
                </p>
                <p className="text-gray-800 leading-relaxed">
                  Este escenario representa lo que ocurriría en una situación real donde la demanda
                  supera significativamente los recursos disponibles de almacenamiento y transporte.
                </p>
              </div>

              {/* Causas principales */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Causas Principales del Colapso:</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold mt-1">•</span>
                    <span className="text-gray-700">
                      <strong>Saturación de aeropuertos:</strong> Los centros de distribución alcanzaron
                      su límite de almacenamiento, generando cuellos de botella en toda la red.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold mt-1">•</span>
                    <span className="text-gray-700">
                      <strong>Sobrecarga de vuelos:</strong> La capacidad de transporte aéreo fue insuficiente
                      para manejar el volumen de paquetes programados.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="w-full bg-primary hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Cerrar Reporte
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FinColapso;
