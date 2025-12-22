"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Cancel";
import HorizontalLinearStepper from "@/components/stepper/componenteStepper.jsx";
import axios from "axios";
import { X } from "lucide-react";

interface GestionPedidosVuelosProps {
  onLoadComplete?: () => void;
  onCancelarVuelo?: (idVuelo: string, archivoAlternativo?: File) => void;
}

const GestionPedidosVuelos: React.FC<GestionPedidosVuelosProps> = ({ 
  onLoadComplete,
  onCancelarVuelo 
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"registrar" | "cancelar">("registrar");

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      {/* Botón flotante único */}
      <button
        onClick={handleOpenDialog}
        className="fixed bottom-8 right-8 z-[85] bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-4 shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
        title="Gestionar pedidos y vuelos"
      >
        <AddIcon className="w-6 h-6" />
        <span className="font-semibold">Gestionar</span>
      </button>

      {/* Modal de gestión */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: "16px",
            minHeight: "600px",
          },
        }}
      >
        <DialogTitle className="bg-gradient-to-r from-primary to-primary/80 text-white">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">Gestión de Pedidos y Vuelos</span>
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleCloseDialog}
              aria-label="cerrar"
            >
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>

        <DialogContent className="p-6">
          {/* Pestañas de selección */}
          <div className="flex justify-center mb-6 border-b-2 border-gray-200">
            <button
              className={`py-3 px-6 flex items-center gap-2 transition-all ${
                activeTab === "registrar"
                  ? "border-b-2 border-primary font-bold text-primary"
                  : "font-normal text-gray-600 hover:text-primary"
              }`}
              onClick={() => setActiveTab("registrar")}
            >
              <AddIcon />
              <span>Registrar Pedido</span>
            </button>
            <button
              className={`py-3 px-6 flex items-center gap-2 transition-all ${
                activeTab === "cancelar"
                  ? "border-b-2 border-red-500 font-bold text-red-500"
                  : "font-normal text-gray-600 hover:text-red-500"
              }`}
              onClick={() => setActiveTab("cancelar")}
            >
              <CancelIcon />
              <span>Cancelar Vuelo</span>
            </button>
          </div>

          {/* Contenido según la pestaña activa */}
          <div className="min-h-[400px]">
            {activeTab === "registrar" ? (
              <RegistrarPedido onComplete={onLoadComplete} onClose={handleCloseDialog} />
            ) : (
              <CancelarVuelo onCancelar={onCancelarVuelo} onClose={handleCloseDialog} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Componente para registrar pedido
const RegistrarPedido: React.FC<{ onComplete?: () => void; onClose: () => void }> = ({
  onComplete,
  onClose,
}) => {
  return (
    <div className="h-full overflow-y-auto px-4">
      <h3 className="text-xl mb-4 text-primary font-bold">Registro de Pedido Individual</h3>
      <HorizontalLinearStepper />
    </div>
  );
};

// Componente para cancelar vuelo
const CancelarVuelo: React.FC<{ 
  onCancelar?: (idVuelo: string, archivoAlternativo?: File) => void; 
  onClose: () => void 
}> = ({ onCancelar, onClose }) => {
  const [idVuelo, setIdVuelo] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [tipoInput, setTipoInput] = useState<"id" | "archivo">("id");

  const handleSubmit = () => {
    if (tipoInput === "id" && idVuelo.trim() && onCancelar) {
      onCancelar(idVuelo);
      handleClose();
    } else if (tipoInput === "archivo" && archivo && onCancelar) {
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
    <div className="p-4 space-y-4">
      <h3 className="text-xl mb-4 text-red-500 font-bold">Cancelación de Vuelos</h3>
      
      {/* Selector de tipo */}
      <div className="flex gap-2">
        <button
          onClick={() => setTipoInput("id")}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            tipoInput === "id"
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Por ID de Vuelo
        </button>
        <button
          onClick={() => setTipoInput("archivo")}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            tipoInput === "archivo"
              ? "bg-red-500 text-white"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
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
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-red-500 transition-colors">
            <input
              type="file"
              accept=".csv,.txt"
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              className="hidden"
              id="archivo-cancelacion-modal"
            />
            <label
              htmlFor="archivo-cancelacion-modal"
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

      {/* Botón de acción */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isValid
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Confirmar Cancelación
        </button>
      </div>
    </div>
  );
};

export default GestionPedidosVuelos;
