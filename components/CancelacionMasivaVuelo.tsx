"use client";
import React, { useState } from "react";
import { X } from "lucide-react";

type Props = {
  onCancelar: (archivo: File) => void;
  onClose: () => void;
};

export default function CancelacionMasivaVuelo({ onCancelar, onClose }: Props) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [previewIds, setPreviewIds] = useState<string[]>([]);
  const [totalIds, setTotalIds] = useState(0);

  const handleArchivoChange = async (file: File | null) => {
    setArchivo(file);
    if (file) {
      const text = await file.text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      // Extraer IDs del formato: ORIGEN-DESTINO-HORA_SALIDA-HORA_LLEGADA-ID
      const ids = lines.map(line => {
        const parts = line.split('-');
        return parts.length >= 5 ? parts[4] : line; // Último campo es el ID
      });
      setPreviewIds(lines.slice(0, 5)); // Mostrar líneas completas en preview
      setTotalIds(ids.length);
    } else {
      setPreviewIds([]);
      setTotalIds(0);
    }
  };

  const handleSubmit = () => {
    if (archivo) {
      onCancelar(archivo);
      handleClose();
    }
  };

  const handleClose = () => {
    setArchivo(null);
    setPreviewIds([]);
    setTotalIds(0);
    onClose();
  };

  const isValid = archivo && totalIds > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Cancelación Masiva
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Cancelar múltiples vuelos mediante archivo
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo de Cancelaciones
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={(e) => handleArchivoChange(e.target.files?.[0] || null)}
                className="hidden"
                id="archivo-cancelacion-masiva"
              />
              <label
                htmlFor="archivo-cancelacion-masiva"
                className="cursor-pointer block text-center"
              >
                {archivo ? (
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="font-semibold text-gray-800">{archivo.name}</p>
                    </div>
                    <p className="text-lg text-blue-600 font-bold">
                      {totalIds} {totalIds === 1 ? 'vuelo' : 'vuelos'} a cancelar
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(archivo.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-700 font-medium mb-1">Haz clic para seleccionar archivo</p>
                    <p className="text-xs text-gray-500">Formatos: CSV o TXT</p>
                  </div>
                )}
              </label>
            </div>
            
            {/* Previsualización de IDs */}
            {archivo && previewIds.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-blue-800 mb-2">
                  Vista previa de vuelos:
                </p>
                <div className="space-y-1.5">
                  {previewIds.map((line, index) => (
                    <div key={index} className="px-3 py-2 bg-white border border-blue-300 rounded-md text-xs font-mono text-gray-700 shadow-sm">
                      {line}
                    </div>
                  ))}
                  {totalIds > 5 && (
                    <div className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold text-center shadow-sm">
                      +{totalIds - 5} vuelos más
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-3 flex items-start gap-1">
                  <svg className="w-3.5 h-3.5 mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Formato: ORIGEN-DESTINO-HORA_SALIDA-HORA_LLEGADA-ID (una línea por vuelo)</span>
                </p>
              </div>
            )}
          </div>

          {/* Advertencia */}
          {totalIds > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    ⚠️ Acción irreversible
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Se cancelarán {totalIds} {totalIds === 1 ? 'vuelo' : 'vuelos'}. Esta acción es simulada y no puede deshacerse.
                  </p>
                </div>
              </div>
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
                ? "bg-red-500 text-white hover:bg-red-600 shadow-lg"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {totalIds > 0 
              ? `Cancelar ${totalIds} ${totalIds === 1 ? 'vuelo' : 'vuelos'}`
              : "Selecciona un archivo"
            }
          </button>
        </div>
      </div>
    </div>
  );
}
