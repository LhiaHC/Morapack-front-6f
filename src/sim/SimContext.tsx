import { createContext, useContext, useEffect, useState } from 'react'
import type { SimConfig, ISODateTime } from '../types'

interface SimContextType {
  simTime: Date
  config: SimConfig
  playing: boolean
  setPlaying: (playing: boolean) => void
  timeScale: number
  setTimeScale: (scale: number) => void
  reset: () => void
  setSimTime: (time: Date) => void
  minTime: Date | null
  maxTime: Date | null
  setMinTime: (time: Date | null) => void
  setMaxTime: (time: Date | null) => void
}

const defaultConfig: SimConfig = {
  startDateISO: '2025-10-20T00:00:00Z' as ISODateTime,
  days: 7,
  timeScale: 120, // 1s real = 2min simulados
  airportCapacityWindowMin: 60,
}

const SimContext = createContext<SimContextType | null>(null)

export function SimProvider({ children }: { children: React.ReactNode }) {
  const [config] = useState<SimConfig>(defaultConfig)
  const [playing, setPlaying] = useState(false)
  const [timeScale, setTimeScale] = useState(config.timeScale)
  const [simTime, setSimTime] = useState(() => new Date(config.startDateISO))
  const [minTime, setMinTime] = useState<Date | null>(null)
  const [maxTime, setMaxTime] = useState<Date | null>(null)
  const [lastRealTime, setLastRealTime] = useState(() => Date.now())
  
  // Actualiza el tiempo de simulación
  useEffect(() => {
    if (!playing) {
      setLastRealTime(Date.now())
      return
    }
    
    const timer = setInterval(() => {
      const now = Date.now()
      const deltaReal = (now - lastRealTime) / 1000 // segundos reales transcurridos
      setLastRealTime(now)
      
      setSimTime(prevTime => {
        const newTime = new Date(prevTime.getTime() + deltaReal * timeScale * 1000)
        
        // Limitar al rango si está definido
        if (maxTime && newTime > maxTime) {
          setPlaying(false)
          return maxTime
        }
        if (minTime && newTime < minTime) {
          return minTime
        }
        
        return newTime
      })
    }, 250) // Actualizar cada 250ms
    
    return () => clearInterval(timer)
  }, [playing, timeScale, minTime, maxTime, lastRealTime])

  const reset = () => {
    setSimTime(minTime || new Date(config.startDateISO))
    setPlaying(false)
  }

  const value = {
    simTime,
    config,
    playing,
    setPlaying,
    timeScale,
    setTimeScale,
    reset,
    setSimTime,
    minTime,
    maxTime,
    setMinTime,
    setMaxTime
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