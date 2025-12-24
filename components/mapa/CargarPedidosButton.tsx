"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle, IconButton, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import HorizontalLinearStepper from "@/components/stepper/componenteStepper.jsx";
import axios from "axios";

interface CargarPedidosButtonProps {
  onLoadComplete?: () => void;
}

const CargarPedidosButton: React.FC<CargarPedidosButtonProps> = ({ onLoadComplete }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"individual" | "archivo">("individual");

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      {/* Botón flotante para cargar pedidos */}
      <button
        onClick={handleOpenDialog}
        className="fixed bottom-24 right-6 z-[45] bg-primary hover:bg-primary/90 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 flex items-center gap-2"
        title="Cargar pedidos"
      >
        <AddIcon className="w-6 h-6" />
        <span className="hidden sm:inline font-semibold">Cargar Pedidos</span>
      </button>

      {/* Modal de carga de pedidos */}
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
            <span className="text-2xl font-bold">Cargar Pedidos</span>
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
                activeTab === "individual"
                  ? "border-b-2 border-primary font-bold text-primary"
                  : "font-normal text-gray-600 hover:text-primary"
              }`}
              onClick={() => setActiveTab("individual")}
            >
              <PersonAddIcon />
              <span>Registro Individual</span>
            </button>
            <button
              className={`py-3 px-6 flex items-center gap-2 transition-all ${
                activeTab === "archivo"
                  ? "border-b-2 border-primary font-bold text-primary"
                  : "font-normal text-gray-600 hover:text-primary"
              }`}
              onClick={() => setActiveTab("archivo")}
            >
              <UploadFileIcon />
              <span>Cargar por Archivo</span>
            </button>
          </div>

          {/* Contenido según la pestaña activa */}
          <div className="min-h-[400px]">
            {activeTab === "individual" ? (
              <CargaIndividual onComplete={onLoadComplete} onClose={handleCloseDialog} />
            ) : (
              <CargaPorArchivo onComplete={onLoadComplete} onClose={handleCloseDialog} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Componente para carga individual
const CargaIndividual: React.FC<{ onComplete?: () => void; onClose: () => void }> = ({
  onComplete,
  onClose,
}) => {
  return (
    <div className="h-full overflow-y-auto px-4">
      <HorizontalLinearStepper />
    </div>
  );
};

// Componente para carga por archivo
const CargaPorArchivo: React.FC<{ onComplete?: () => void; onClose: () => void }> = ({
  onComplete,
  onClose,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [codigos, setCodigos] = useState<string[]>([]);
  const baseUrl = process.env.NEXT_PUBLIC_MORAPACK_API_URL;
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      handleUpload(selectedFile);
    }
  };

  const handleUpload = async (fileToUpload: File) => {
    setIsUploading(true);
    setUploadStatus("idle");
    
    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      const response = await axios.post(`${baseUrl}/archivo/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 1000 * 60 * 10, // 10 minutos
      });

      if (response.status === 200) {
        setUploadStatus("success");
        
        // Procesar códigos de paquetes
        if (response.data.indexOf(" ") === -1) {
          setCodigos([response.data]);
        } else {
          setCodigos(response.data.split(" "));
        }

        if (onComplete) {
          onComplete();
        }

        // Cerrar modal después de 3 segundos
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setUploadStatus("error");
      }
    } catch (error) {
      console.error("Error al subir el archivo:", error);
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="w-full max-w-2xl">
        <h3 className="text-2xl mb-4 text-primary text-center font-bold">
          Registro de envío por archivo
        </h3>
        <p className="text-gray-600 text-center mb-6">
          Sube el archivo deseado para registrar un conjunto de envíos en velocidad normal
        </p>

        {/* Área de carga de archivo */}
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
          onClick={handleButtonClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv,.txt"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <UploadFileIcon style={{ fontSize: 60 }} className="mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-semibold text-gray-700 mb-2">
            {isUploading ? "Subiendo archivo..." : "Haz clic para seleccionar un archivo"}
          </p>
          <p className="text-sm text-gray-500">
            Formatos permitidos: CSV, TXT
          </p>
        </div>

        {file && !isUploading && uploadStatus === "idle" && (
          <p className="mt-4 text-center text-gray-600">
            Archivo seleccionado: <span className="font-semibold">{file.name}</span>
          </p>
        )}

        {isUploading && (
          <div className="mt-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {uploadStatus === "success" && (
          <div className="mt-6 p-4 bg-green-100 text-green-900 rounded-lg">
            <p className="text-center font-bold pb-2">✅ Archivo subido correctamente</p>
            <div className="max-h-60 overflow-y-auto">
              <p className="w-full mb-2 text-center">
                Códigos de <span className="font-bold">{codigos.length}</span> paquetes generados:
              </p>
              <div className="grid grid-cols-4 gap-2 text-sm">
                {codigos.map((codigo, index) => (
                  <div key={index} className="bg-green-200 px-2 py-1 rounded text-center font-mono">
                    {codigo}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {uploadStatus === "error" && (
          <div className="mt-6 p-4 bg-red-100 text-red-900 rounded-lg">
            <p className="text-center font-bold">❌ Error al subir el archivo</p>
            <p className="text-center text-sm mt-2">
              Por favor, verifica el formato del archivo e intenta nuevamente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CargarPedidosButton;
