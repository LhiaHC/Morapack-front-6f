"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  startDate: Date;
  onDone: () => void;
};

type Step = {
  name: string;
  detail: string;
  ms: number;
};

type FileUpload = {
  pedidos: File | null;
  vuelos: File | null;
  almacenes: File | null;
};

export default function SimulacionPreloadScreen({ startDate, onDone }: Props) {
  const [files, setFiles] = useState<FileUpload>({
    pedidos: null,
    vuelos: null,
    almacenes: null,
  });
  const [phase, setPhase] = useState<"idle" | "processing" | "done">("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const rafRef = useRef<number | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  const steps: Step[] = useMemo(() => {
    const y = startDate.getFullYear();
    const m = String(startDate.getMonth() + 1).padStart(2, "0");
    const d = String(startDate.getDate()).padStart(2, "0");

    return [
      { name: "Pedidos", detail: "Leyendo archivo de pedidos...", ms: 1200 },
      { name: "Vuelos", detail: "Procesando archivo de vuelos...", ms: 1300 },
      { name: "Almacenes", detail: "Cargando archivo de almacenes...", ms: 1100 },
      { name: "Validaciones", detail: "Validando columnas y formatos...", ms: 1000 },
      { name: "Normalización", detail: "Normalizando zonas horarias...", ms: 900 },
      { name: "Enriquecimiento", detail: "Cruzando datos entre archivos...", ms: 1200 },
      { name: "Consolidación", detail: "Armando lotes y priorización...", ms: 1300 },
      { name: "Resumen", detail: "Generando índice para la simulación...", ms: 900 },
    ];
  }, [startDate]);

  const clearAllTimers = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  const allFilesSelected = files.pedidos && files.vuelos && files.almacenes;

  const startProcessing = () => {
    if (!allFilesSelected) return;

    clearAllTimers();
    setPhase("processing");
    setProgress(0);
    setStepIndex(0);

    const totalMs = steps.reduce((a, s) => a + s.ms, 0);
    const start = performance.now();
    let alive = true;

    const tick = () => {
      if (!alive) return;
      const elapsed = performance.now() - start;
      const p = Math.min(100, (elapsed / totalMs) * 100);
      setProgress(p);
      if (p < 100) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    let acc = 0;
    steps.forEach((s, idx) => {
      acc += s.ms;
      const id = window.setTimeout(() => {
        if (!alive) return;
        setStepIndex(Math.min(idx + 1, steps.length));
        if (idx === steps.length - 1) {
          const doneId = window.setTimeout(() => {
            if (!alive) return;
            setPhase("done");
            const finalId = window.setTimeout(() => onDone(), 700);
            timeoutsRef.current.push(finalId);
          }, 350);
          timeoutsRef.current.push(doneId);
        }
      }, acc);
      timeoutsRef.current.push(id);
    });

    return () => {
      alive = false;
      clearAllTimers();
    };
  };

  useEffect(() => {
    return () => clearAllTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = steps[Math.min(stepIndex, steps.length - 1)];
  const isIdle = phase === "idle";
  const isProcessing = phase === "processing";
  const isDone = phase === "done";

  const handleFileChange = (type: keyof FileUpload, file: File | null) => {
    setFiles((prev) => ({ ...prev, [type]: file }));
    setPhase("idle");
    setProgress(0);
    setStepIndex(0);
  };

  const FileUploadBox = ({
    label,
    type,
    accept,
  }: {
    label: string;
    type: keyof FileUpload;
    accept: string;
  }) => {
    const file = files[type];
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="min-w-0">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="font-semibold text-gray-800 truncate">
              {file ? file.name : "Ningún archivo seleccionado"}
            </div>
            <div className="text-xs text-gray-600">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : "Formato: CSV"}
            </div>
          </div>

          <label className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 cursor-pointer text-sm font-medium text-gray-700">
            <input
              type="file"
              accept={accept}
              className="hidden"
              disabled={isProcessing || isDone}
              onChange={(e) => handleFileChange(type, e.target.files?.[0] || null)}
            />
            Elegir archivo
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="w-full max-w-2xl px-6">
        <div className="bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Cargar archivos para simulación
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Selecciona los 3 archivos CSV necesarios para la simulación.
              </p>
            </div>
          </div>

          {/* Zona de carga de archivos */}
          <div className="space-y-3">
            <FileUploadBox label="Archivo de Pedidos" type="pedidos" accept=".csv,.txt" />
            <FileUploadBox label="Archivo de Vuelos" type="vuelos" accept=".csv,.txt" />
            <FileUploadBox label="Archivo de Almacenes" type="almacenes" accept=".csv,.txt" />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => startProcessing()}
              disabled={!allFilesSelected || isProcessing || isDone}
              className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors
                ${
                  !allFilesSelected || isProcessing || isDone
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-primary text-white hover:opacity-95"
                }`}
            >
              {isIdle && "Cargar y procesar archivos"}
              {isProcessing && "Procesando..."}
              {isDone && "Archivos cargados ✅"}
            </button>

            <div className="text-xs text-gray-500 flex items-center">
              {isIdle &&
                `${
                  allFilesSelected
                    ? "Todos los archivos seleccionados. Listo para procesar."
                    : `Faltan ${3 - Object.values(files).filter(Boolean).length} archivo(s).`
                }`}
              {isProcessing && "Procesando archivos CSV (simulado)."}
              {isDone && "Listo. Regresando al menú de simulación..."}
            </div>
          </div>

          {/* Progreso + pasos */}
          {(isProcessing || isDone) && (
            <>
              <div className="mt-5 rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500">Etapa actual</div>
                    <div className="font-semibold text-gray-800 truncate">
                      {current?.name}
                    </div>
                    <div className="text-sm text-gray-600">{current?.detail}</div>
                  </div>
                  <div className="shrink-0 text-sm font-semibold text-gray-700">
                    {Math.round(progress)}%
                  </div>
                </div>

                <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {steps.map((s, idx) => {
                  const done = idx < stepIndex;
                  const active = idx === stepIndex && !isDone;
                  return (
                    <div
                      key={`${s.name}-${idx}`}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 border ${
                        done
                          ? "bg-green-50 border-green-200"
                          : active
                          ? "bg-blue-50 border-blue-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {s.name}
                        </div>
                        <div className="text-xs text-gray-600 truncate">{s.detail}</div>
                      </div>
                      <div className="ml-3 text-xs font-semibold">
                        {done ? "✔" : active ? "…" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-5 text-xs text-gray-500">
            * Los 3 archivos son requeridos para iniciar la simulación.
          </div>
        </div>
      </div>
    </div>
  );
}