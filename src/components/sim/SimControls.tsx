import { useSimulation } from '../../sim/SimContext'

export default function SimControls() {
  const { 
    simTime, 
    playing, 
    setPlaying, 
    timeScale, 
    setTimeScale, 
    reset 
  } = useSimulation()

  return (
    <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-md z-[40]">
      <div className="mb-4">
        <div className="text-sm text-gray-500">Simulation Time</div>
        <div className="text-lg font-mono">
          {simTime.toISOString().replace('T', ' ').slice(0, 19)}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setPlaying(!playing)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {playing ? '⏸️ Pause' : '▶️ Play'}
        </button>

        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          🔄 Reset
        </button>

        <select
          value={timeScale}
          onChange={e => setTimeScale(Number(e.target.value))}
          className="px-3 py-2 border rounded"
        >
          <option value="60">1min/s</option>
          <option value="120">2min/s</option>
          <option value="300">5min/s</option>
          <option value="600">10min/s</option>
          <option value="1800">30min/s</option>
          <option value="3600">1h/s</option>
        </select>
      </div>
    </div>
  )
}