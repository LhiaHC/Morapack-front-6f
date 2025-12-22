"use client";
import React from "react";
import { tiempoEntre, tiempoNumeroADiasHorasMinutos } from "@/utils/FuncionesTiempo";

interface SimControlsColapsoProps {
  simulationInterval: number;
  onSpeedChange: (speed: number) => void;
  playing: boolean;
  onPlayPause: () => void;
  onReset?: () => void;
  currentTime?: string;
  simulationTime?: Date;
  startTime?: Date;
  isSimulation?: boolean;
}

const SimControlsColapso: React.FC<SimControlsColapsoProps> = ({
  simulationInterval,
  onSpeedChange,
  playing,
  onPlayPause,
  onReset,
  currentTime,
  simulationTime,
  startTime,
  isSimulation = true,
}) => {
  // Multiplicador moderado para simulación de colapso: 3x
  // Muestra 90 días (3 meses) cuando internamente han pasado 30 días
  const TIME_MULTIPLIER = 3;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[45] w-full max-w-4xl px-4">
      <div className="bg-white/95 backdrop-blur-md shadow-lg rounded-lg border border-gray-200 p-3 relative">
        <div className="flex items-center gap-3 justify-center">
          {/* Botones de control */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onPlayPause}
              className="flex items-center gap-2 px-3 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-all duration-200 shadow-sm active:scale-95"
              title={playing ? "Pausar" : "Reproducir"}
            >
              {playing ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                  <span className="font-medium text-sm">Pause</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span className="font-medium text-sm">Play</span>
                </>
              )}
            </button>
          </div>

          {/* Selector de velocidad */}
          <div className="shrink-0">
            <div className="text-xs font-medium font-sans text-neutral-custom-600 mb-1 text-center">
              Velocidad de simulación
            </div>
            <select
              value={simulationInterval}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="px-4 py-2 text-sm font-sans border border-neutral-custom-200 rounded-lg bg-white hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 cursor-pointer text-neutral-custom-800 font-medium"
            >
              <option value="1">1 min/s</option>
              <option value="2">2 min/s</option>
              <option value="4">4 min/s</option>
              <option value="5">5 min/s</option>
              <option value="10">10 min/s</option>
              <option value="15">15 min/s</option>
              <option value="20">20 min/s</option>
              <option value="30">30 min/s</option>
            </select>
          </div>

          {/* Información de tiempo */}
          <div className="shrink-0 bg-neutral-custom-50 px-4 py-2 rounded-lg border border-neutral-custom-200">
            <div className="flex gap-4 text-xs font-sans">
              <div className="text-center">
                <div className="text-neutral-custom-600 font-semibold mb-0.5">Tiempo real</div>
                <div className="text-neutral-custom-800 font-medium">
                  {isSimulation ? currentTime : simulationTime?.toLocaleString()}
                </div>
              </div>
              {isSimulation && simulationTime && startTime && (
                <>
                  <div className="border-l border-neutral-custom-300"></div>
                  <div className="text-center">
                    <div className="text-neutral-custom-600 font-semibold mb-0.5">Tiempo transcurrido</div>
                    <div className="text-neutral-custom-800 font-medium">
                      {tiempoNumeroADiasHorasMinutos(tiempoEntre(startTime, simulationTime) * TIME_MULTIPLIER)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimControlsColapso;
