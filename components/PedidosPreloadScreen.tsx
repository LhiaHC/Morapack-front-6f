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

export default function PedidosPreloadScreen({ startDate, onDone }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<"idle" | "processing" | "done">("idle");

  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const rafRef = useRef<number | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  const steps: Step[] = useMemo(() => {
    // Si el usuario sube un archivo, lo usamos; si no, mostramos nombres basados en fecha
    const y = startDate.getFullYear();
    const m = String(startDate.getMonth() + 1).padStart(2, "0");
    const d = String(startDate.getDate()).padStart(2, "0");
    const fileName = selectedFile?.name || `pedidos_${y}${m}${d}.csv`;

    return [
      { name: fileName, detail: "Leyendo archivo...", ms: 1100 },
      { name: "validaciones", detail: "Validando columnas y formatos...", ms: 1000 },
      { name: "normalización", detail: "Normalizando zonas horarias...", ms: 900 },
      { name: "enriquecimiento", detail: "Cruzando clientes y destinos...", ms: 1100 },
      { name: "consolidación", detail: "Armando lotes y priorización...", ms: 1200 },
      { name: "resumen", detail: "Generando índice para la simulación...", ms: 900 },
    ];
  }, [startDate, selectedFile]);

  const clearAllTimers = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  const startProcessing = () => {
    if (!selectedFile) return;

    clearAllTimers();
    setPhase("processing");
    setProgress(0);
    setStepIndex(0);

    const totalMs = steps.reduce((a, s) => a + s.ms, 0);
    const start = performance.now();
    let alive = true;

    // progreso global suave
    const tick = () => {
      if (!alive) return;
      const elapsed = performance.now() - start;
      const p = Math.min(100, (elapsed / totalMs) * 100);
      setProgress(p);
      if (p < 100) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // avance por pasos
    let acc = 0;
    steps.forEach((s, idx) => {
      acc += s.ms;
      const id = window.setTimeout(() => {
        if (!alive) return;
        setStepIndex(Math.min(idx + 1, steps.length));
        if (idx === steps.length - 1) {
          // terminado
          const doneId = window.setTimeout(() => {
            if (!alive) return;
            setPhase("done");
            // un pequeño delay para que el usuario vea el "✅"
            const finalId = window.setTimeout(() => onDone(), 700);
            timeoutsRef.current.push(finalId);
          }, 350);
          timeoutsRef.current.push(doneId);
        }
      }, acc);
      timeoutsRef.current.push(id);
    });

    // cleanup por si desmonta
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

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="w-full max-w-xl px-6">
        <div className="bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Cargar pedidos del día
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Selecciona un archivo para simular la carga y procesamiento antes de iniciar la simulación.
              </p>
            </div>
            <div className="text-xs text-gray-500 text-right">
              <div className="font-medium">Fecha</div>
              <div>{startDate.toLocaleString()}</div>
            </div>
          </div>

          {/* Zona de carga de archivo */}
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="min-w-0">
                <div className="text-xs text-gray-500">Archivo de pedidos</div>
                <div className="font-semibold text-gray-800 truncate">
                  {selectedFile ? selectedFile.name : "Ningún archivo seleccionado"}
                </div>
                <div className="text-xs text-gray-600">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                    : "Formato sugerido: CSV"}
                </div>
              </div>

              <label className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 cursor-pointer text-sm font-medium text-gray-700">
                <input
                  type="file"
                  accept=".csv,.txt,.json"
                  className="hidden"
                  disabled={isProcessing || isDone}
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setSelectedFile(f);
                    setPhase("idle");
                    setProgress(0);
                    setStepIndex(0);
                  }}
                />
                Elegir archivo
              </label>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => startProcessing()}
                disabled={!selectedFile || isProcessing || isDone}
                className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors
                  ${
                    !selectedFile || isProcessing || isDone
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-primary text-white hover:opacity-95"
                  }`}
              >
                {isIdle && "Cargar y procesar"}
                {isProcessing && "Procesando..."}
                {isDone && "Archivo cargado ✅"}
              </button>

              <div className="text-xs text-gray-500 flex items-center">
                {isIdle && "Luego de procesar, se iniciará la carga real del sistema."}
                {isProcessing && "Procesando en segundo plano (simulado)."}
                {isDone && "Listo. Iniciando simulación..."}
              </div>
            </div>
          </div>

          {/* Progreso + pasos (solo cuando procesa o terminó) */}
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
            * Esto es una simulación visual: no sube el archivo al servidor. (Si luego quieres hacerlo real con un endpoint, también te lo armo.)
          </div>
        </div>
      </div>
    </div>
  );
}
