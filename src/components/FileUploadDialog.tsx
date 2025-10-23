import * as React from 'react';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from './ui/Dialog';

type FilesState = { flights?: File | null; airports?: File | null; orders?: File | null; };

export type FileUploadDialogProps = {
  open: boolean;
  onOpenChange: (v:boolean)=>void;
  onConfirm: (files: FilesState) => void;
  acceptFlights?: string;
  acceptAirports?: string;
  acceptOrders?: string;
  dataAlreadyLoaded?: boolean;
};

export default function FileUploadDialog({
  open, onOpenChange, onConfirm,
  acceptFlights = '.csv,.txt,.json',
  acceptAirports = '.csv,.txt,.json',
  acceptOrders = '.csv,.txt,.json',
  dataAlreadyLoaded = false,
}: FileUploadDialogProps) {

  const [files, setFiles] = React.useState<FilesState>({});

  const setFile = (key: keyof FilesState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFiles(prev => ({ ...prev, [key]: e.target.files?.[0] ?? null }));

  const canConfirm = !!files.flights || !!files.airports || !!files.orders;

  const handleConfirm = () => {
    if (!canConfirm) return;

    onConfirm(files);
    onOpenChange(false);
    setFiles({});
  };

  const FileRow = ({
    label, icon, accept, onChange, id, selectedFileName,
  }: {
    label: string; icon: React.ReactNode; accept: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>)=>void;
    id: string;
    selectedFileName?: string;
  }) => (
    <div className="space-y-2 opacity-100">
      <div className="flex items-center gap-3 text-base">
        <span className="text-xl">{icon}</span>
        <span>{label}</span>
      </div>
      <label
        htmlFor={id}
        className="block rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-700 cursor-pointer hover:bg-neutral-100"
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <span className="text-lg">⤴︎</span>
            {selectedFileName ? (
              <span className="text-sm font-medium text-green-600 truncate max-w-[200px]">
                {selectedFileName}
              </span>
            ) : (
              <span>Seleccionar archivo</span>
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
        />
      </label>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>Cargar Archivos</DialogHeader>

      <DialogBody>
        {dataAlreadyLoaded && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <div className="font-semibold text-blue-900 mb-1">
                  Los datos ya han sido cargados
                </div>
                <div className="text-sm text-blue-700">
                  Esta es una carga inicial que solo se realiza una vez. Los archivos ya fueron procesados y almacenados en el backend.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6">
          <FileRow
            label="Archivo para vuelos"
            icon={<span>✈️</span>}
            accept={acceptFlights}
            onChange={setFile('flights')}
            id="upload-flights"
            selectedFileName={files.flights?.name}
          />
          <FileRow
            label="Archivo para aeropuertos"
            icon={<span>🏢</span>}
            accept={acceptAirports}
            onChange={setFile('airports')}
            id="upload-airports"
            selectedFileName={files.airports?.name}
          />
          <FileRow
            label="Archivo para pedidos"
            icon={<span>📦</span>}
            accept={acceptOrders}
            onChange={setFile('orders')}
            id="upload-orders"
            selectedFileName={files.orders?.name}
          />
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
