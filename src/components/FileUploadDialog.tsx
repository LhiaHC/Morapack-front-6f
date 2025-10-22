import * as React from 'react';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from './ui/Dialog';
import { UploadService } from '../services/api'; // 👈 Asegúrate de tener este servicio importado

type FilesState = { flights?: File | null; airports?: File | null; orders?: File | null; };

export type FileUploadDialogProps = {
  open: boolean;
  onOpenChange: (v:boolean)=>void;
  onConfirm: (files: FilesState) => void;
  acceptFlights?: string;
  acceptAirports?: string;
  acceptOrders?: string;
};

export default function FileUploadDialog({
  open, onOpenChange, onConfirm,
  acceptFlights = '.csv,.txt,.json',
  acceptAirports = '.csv,.txt,.json',
}: FileUploadDialogProps) {

  const [files, setFiles] = React.useState<FilesState>({});
  const [airportsReady, setAirportsReady] = React.useState(false);
  const [checkingAirports, setCheckingAirports] = React.useState(true);

  // 🔍 Verificar si ya existen aeropuertos en BD al abrir el modal
  React.useEffect(() => {
    const verificarAeropuertos = async () => {
      try {
        const res = await UploadService.getAllAirports(); // GET /api/aeropuertos
        const total = res.data?.data?.aeropuertos?.length ?? 0;
        setAirportsReady(total > 0);
      } catch (e) {
        console.error("Error verificando aeropuertos:", e);
      } finally {
        setCheckingAirports(false);
      }
    };

    if (open) {
      verificarAeropuertos();
    }
  }, [open]);

  const setFile = (key: keyof FilesState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFiles(prev => ({ ...prev, [key]: e.target.files?.[0] ?? null }));

  const canConfirm = !!files.flights || !!files.airports || !!files.orders;

  const handleConfirm = () => {
    if (!canConfirm) return;

    // ⚠️ Validar que no intente subir vuelos sin aeropuertos cargados
    if (files.flights && !airportsReady) {
      alert("⚠️ No puedes cargar vuelos hasta que existan aeropuertos cargados en el sistema.");
      return;
    }

    onConfirm(files);
    onOpenChange(false);
    setFiles({});
  };

  const FileRow = ({
    label, icon, accept, onChange, id, selectedFileName, disabled,
  }: {
    label: string; icon: React.ReactNode; accept: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>)=>void;
    id: string;
    selectedFileName?: string;
    disabled?: boolean;
  }) => (
    <div className="space-y-2 opacity-100">
      <div className="flex items-center gap-3 text-base">
        <span className="text-xl">{icon}</span>
        <span>{label}</span>
      </div>
      <label
        htmlFor={id}
        className={`block rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-700 ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:bg-neutral-100'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <span className="text-lg">⤴︎</span>
            {selectedFileName ? (
              <span className="text-sm font-medium text-green-600 truncate max-w-[200px]">
                {selectedFileName}
              </span>
            ) : (
              <span>{disabled ? 'Bloqueado hasta subir aeropuertos' : 'Seleccionar archivo'}</span>
            )}
          </span>
          {selectedFileName && (
            <span className="text-xs text-neutral-500">✓</span>
          )}
        </div>
        <input
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onChange}
          disabled={disabled}
        />
      </label>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>Cargar Archivos</DialogHeader>

      <DialogBody>
        <div className="grid gap-6">
          <FileRow
            label="Archivo para vuelos"
            icon={<span>✈️</span>}
            accept={acceptFlights}
            onChange={setFile('flights')}
            id="upload-flights"
            selectedFileName={files.flights?.name}
            disabled={!airportsReady}
          />
          <FileRow
            label="Archivo para aeropuertos"
            icon={<span>🏢</span>}
            accept={acceptAirports}
            onChange={setFile('airports')}
            id="upload-airports"
            selectedFileName={files.airports?.name}
          />

          {/* Indicador del estado actual */}
          <p className="text-sm text-gray-500 mt-1">
            {checkingAirports
              ? "Verificando aeropuertos en base de datos..."
              : airportsReady
              ? "✅ Aeropuertos detectados en el sistema. Puedes cargar vuelos."
              : "⚠️ No hay aeropuertos cargados. Debes subirlos antes de los vuelos."}
          </p>
        </div>
      </DialogBody>

      <DialogFooter>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="w-full sm:w-auto rounded-xl px-5 py-2.5 border bg-white hover:bg-neutral-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          disabled={!canConfirm}
          onClick={handleConfirm}
          className="w-full sm:w-auto rounded-xl px-5 py-2.5 bg-black text-white disabled:bg-gray-400 disabled:text-gray-700 disabled:opacity-100"
        >
          Confirmar
        </button>
      </DialogFooter>
    </Dialog>
  );
}
