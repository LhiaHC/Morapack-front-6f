import { createContext, useContext, useEffect, useState } from 'react'
import type { SimConfig, ISODateTime } from './types'

interface SimContextType {
  simTime: Date
  config: SimConfig
  playing: boolean
  setPlaying: (playing: boolean) => void
  timeScale: number
  setTimeScale: (scale: number) => void
  reset: () => void
}

const defaultConfig: SimConfig = {
  startDateISO: '2025-01-01T00:00:00Z' as ISODateTime,
  days: 7,
  timeScale: 120, // 1s real = 2min simulados
  airportCapacityWindowMin: 60,
}

const SimContext = createContext<SimContextType | null>(null)

export function SimProvider({ children }: { children: React.ReactNode }) {
  const [config] = useState<SimConfig>(defaultConfig)
  const [playing, setPlaying] = useState(true)
  const [timeScale, setTimeScale] = useState(config.timeScale)
  const [simTime, setSimTime] = useState(() => new Date(config.startDateISO))
  
  // Actualiza el tiempo de simulación
  useEffect(() => {
    if (!playing) return
    
    const startReal = Date.now()
    const startSim = new Date(config.startDateISO).getTime()
    
    const timer = setInterval(() => {
      const now = Date.now()
      const elapsed = now - startReal
      setSimTime(new Date(startSim + elapsed * timeScale))
    }, 1000)
    
    return () => clearInterval(timer)
  }, [playing, timeScale, config.startDateISO])

  const reset = () => {
    setSimTime(new Date(config.startDateISO))
  }

  const value = {
    simTime,
    config,
    playing,
    setPlaying,
    timeScale,
    setTimeScale,
    reset,
  }

  return (
    <SimContext.Provider value={value}>
      {children}
    </SimContext.Provider>
  )
}

export function useSimulation() {
  const context = useContext(SimContext)
  if (!context) {
    throw new Error('useSimulation must be used within SimProvider')
  }
  return context
}