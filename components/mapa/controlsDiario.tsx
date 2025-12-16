"use client";
import React from "react";
import { tiempoEntre, tiempoNumeroADiasHorasMinutos } from "@/utils/FuncionesTiempo";

interface SimControlsProps {
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

const SimControls: React.FC<SimControlsProps> = ({
  simulationInterval,
  onSpeedChange = 1,
  playing,
  onPlayPause,
  onReset,
  currentTime,
  simulationTime,
  startTime,
  isSimulation = true,
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[45] w-full max-w-4xl px-4">
      <div className="bg-white/95 backdrop-blur-md shadow-lg rounded-lg border border-gray-200 p-3 relative">
        <div className="flex items-center gap-3 justify-center">
          {/* Información de tiempo */}
          <div className="shrink-0 bg-neutral-custom-50 px-4 py-2 rounded-lg border border-neutral-custom-200">
            <div className="flex gap-4 text-xs font-sans">
              <div className="text-center">
                <div className="text-neutral-custom-600 font-semibold mb-0.5">Tiempo real</div>
                <div className="text-neutral-custom-800 font-medium">
                  {isSimulation ? currentTime : simulationTime?.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimControls;
