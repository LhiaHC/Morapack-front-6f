"use client";
import React, { useState } from "react";
import { X } from "lucide-react";

type Props = {
  onCancelar: (idVuelo: string, archivoAlternativo?: File) => void;
  onClose: () => void;
  vueloPreseleccionado?: string;
};

export default function CancelacionVuelo({ onCancelar, onClose, vueloPreseleccionado }: Props) {
  const [idVuelo, setIdVuelo] = useState(vueloPreseleccionado || "");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [tipoInput, setTipoInput] = useState<"id" | "archivo">("id");

  const handleSubmit = () => {
    if (tipoInput === "id" && idVuelo.trim()) {
      onCancelar(idVuelo);
      handleClose();
    } else if (tipoInput === "archivo" && archivo) {
      onCancelar("", archivo);
      handleClose();
    }
  };

  const handleClose = () => {
    setIdVuelo("");
    setArchivo(null);
    onClose();
  };

  const isValid = 
    (tipoInput === "id" && idVuelo.trim()) || 
    (tipoInput === "archivo" && archivo);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            Cancelar Vuelo
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Selector de tipo */}
          <div className="flex gap-2">
            <button
              onClick={() => setTipoInput("id")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                tipoInput === "id"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Por ID de Vuelo
            </button>
            <button
              onClick={() => setTipoInput("archivo")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                tipoInput === "archivo"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Por Archivo
            </button>
          </div>

          {/* Input según tipo */}
          {tipoInput === "id" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID del Vuelo
              </label>
              <input
                type="text"
                value={idVuelo}
                onChange={(e) => setIdVuelo(e.target.value)}
                placeholder="Ej: 12345"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Ingresa el ID del vuelo que deseas cancelar
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo de Cancelaciones
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary transition-colors">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                  className="hidden"
                  id="archivo-cancelacion"
                />
                <label
                  htmlFor="archivo-cancelacion"
                  className="cursor-pointer block text-center"
                >
                  {archivo ? (
                    <div>
                      <p className="font-semibold text-gray-800">{archivo.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(archivo.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600">Haz clic para seleccionar archivo</p>
                      <p className="text-xs text-gray-500 mt-1">CSV o TXT</p>
                    </div>
                  )}
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                El archivo debe contener los IDs de los vuelos a cancelar
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
              isValid
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Confirmar Cancelación
          </button>
        </div>
      </div>
    </div>
  );
}