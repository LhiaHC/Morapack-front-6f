"use client";
import React from 'react';
import { FaPlane, FaBox } from 'react-icons/fa';

interface NewOrderIndicatorProps {
  origen: string;
  destino: string;
  paquetes: number;
}

const NewOrderIndicator: React.FC<NewOrderIndicatorProps> = ({ origen, destino, paquetes }) => {
  return (
    <div className="fixed bottom-40 right-6 z-[95] bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-2xl p-4 min-w-[320px] animate-pulse-slow">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-full p-3">
          <FaBox className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">🎉 Nuevo Pedido Registrado</h3>
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Origen:</span>
              <span className="bg-white bg-opacity-30 px-2 py-0.5 rounded">{origen}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaPlane className="text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Destino:</span>
              <span className="bg-white bg-opacity-30 px-2 py-0.5 rounded">{destino}</span>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white border-opacity-30">
              <FaBox className="w-4 h-4" />
              <span className="font-semibold">{paquetes}</span>
              <span>paquete{paquetes !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="mt-3 text-xs bg-white bg-opacity-20 rounded-lg p-2 text-center">
            ⏳ Siendo planificado para el próximo vuelo disponible
          </div>
        </div>
      </div>
      
      {/* Animación de borde brillante */}
      <div className="absolute inset-0 rounded-xl border-2 border-white opacity-50 animate-ping-slow"></div>
      
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.95;
          }
        }
        
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.02);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        
        .animate-ping-slow {
          animation: ping-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NewOrderIndicator;
