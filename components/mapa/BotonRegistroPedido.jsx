"use client";
import React, { useState } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import Box from '@mui/material/Box';
import ComponenteStepper from "../stepper/componenteStepper";

export default function BotonRegistroPedido() {
  const [isOpen, setIsOpen] = useState(false);

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={togglePanel}
        className={`fixed bottom-8 right-8 z-[90] rounded-full shadow-2xl flex items-center gap-3 transition-all duration-300 hover:scale-105 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600 px-6 py-4' 
            : 'bg-primary hover:bg-primary-600 px-6 py-4'
        }`}
        title={isOpen ? "Cerrar registro" : "Registrar nuevo pedido"}
      >
        {isOpen ? (
          <>
            <FaTimes className="text-white text-xl" />
            <span className="text-white font-semibold text-base">Cerrar</span>
          </>
        ) : (
          <>
            <FaPlus className="text-white text-xl" />
            <span className="text-white font-semibold text-base">Registrar Pedido</span>
          </>
        )}
      </button>

      {/* Panel Flotante */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[85]"
            onClick={togglePanel}
          />

          {/* Panel */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[90] w-11/12 max-w-4xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header del Panel */}
            <div className="bg-gradient-to-r from-primary to-primary-700 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Registrar Nuevo Pedido</h2>
                <p className="text-sm text-primary-50 mt-1">Complete el formulario para registrar un envío</p>
              </div>
              <button
                onClick={togglePanel}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Contenido del Panel */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
              <ComponenteStepper />
            </div>
          </div>
        </>
      )}
    </>
  );
}
