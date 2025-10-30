import { useSimulation } from '../../sim/SimContext'

export default function SimControls({ onClose }: { onClose?: () => void }) {
  const {
    simTime,
    playing,
    setPlaying,
    timeScale,
    setTimeScale,
    reset,
    setSimTime,
    minTime,
    maxTime
  } = useSimulation()

  // Convertir tiempo a timestamp para el slider
  const currentTimestamp = simTime.getTime()
  const minTimestamp = minTime?.getTime() || currentTimestamp
  const maxTimestamp = maxTime?.getTime() || currentTimestamp

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTimestamp = parseInt(e.target.value, 10)
    setSimTime(new Date(newTimestamp))
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[45] w-full max-w-4xl px-4">
      <div className="bg-white/95 backdrop-blur-md shadow-lg rounded-lg border border-neutral-custom-200 p-4 relative">
        <div className="flex items-center gap-4">
          {/* Botones de control */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setPlaying(!playing)}
              className="w-12 h-12 flex items-center justify-center bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all duration-200 shadow-sm active:scale-95"
              title={playing ? 'Pausar' : 'Reproducir'}
            >
              {playing ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            <button
              onClick={reset}
              className="w-12 h-12 flex items-center justify-center bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 shadow-sm active:scale-95"
              title="Reiniciar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Información de tiempo y slider */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-neutral-custom-600">Tiempo de Simulación</div>
              <div className="text-sm font-mono font-semibold text-neutral-custom-800">
                {simTime.toISOString().slice(0, 19).replace('T', ' ')} UTC
              </div>
            </div>

            {/* Slider de tiempo */}
            {minTime && maxTime && (
              <div className="relative">
                <input
                  type="range"
                  min={minTimestamp}
                  max={maxTimestamp}
                  value={currentTimestamp}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-neutral-custom-200 rounded-full appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, #00897B 0%, #00897B ${
                      ((currentTimestamp - minTimestamp) / (maxTimestamp - minTimestamp)) * 100
                    }%, #D1D5D8 ${
                      ((currentTimestamp - minTimestamp) / (maxTimestamp - minTimestamp)) * 100
                    }%, #D1D5D8 100%)`
                  }}
                />
                <div className="flex justify-between text-[10px] text-neutral-custom-500 mt-1">
                  <span>{minTime.toISOString().slice(5, 16)}</span>
                  <span>{maxTime.toISOString().slice(5, 16)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Selector de velocidad */}
          <div className="shrink-0">
            <div className="text-[10px] font-medium text-neutral-custom-600 mb-1 text-center">Velocidad</div>
            <select
              value={timeScale}
              onChange={e => setTimeScale(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-neutral-custom-200 rounded-lg bg-white hover:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all duration-200 cursor-pointer text-neutral-custom-800"
            >
              <option value="30">30s/s</option>
              <option value="60">1min/s</option>
              <option value="120">2min/s</option>
              <option value="300">5min/s</option>
              <option value="600">10min/s</option>
              <option value="1800">30min/s</option>
              <option value="3600">1h/s</option>
            </select>
          </div>

          {/* Botón cerrar simulación - al final de la fila */}
          {onClose && (
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-lg hover:bg-neutral-custom-100 transition-all duration-200 shadow-sm active:scale-95 border border-neutral-custom-200"
              title="Cerrar simulación"
            >
              <span className="text-2xl font-bold leading-none">×</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #00897B;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 137, 123, 0.4);
          transition: all 0.3s;
        }
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(0, 137, 123, 0.6);
        }
        .slider-thumb::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border: none;
          border-radius: 50%;
          background: #00897B;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 137, 123, 0.4);
          transition: all 0.3s;
        }
        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(0, 137, 123, 0.6);
        }
      `}</style>
    </div>
  )
}