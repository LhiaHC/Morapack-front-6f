import type { ISODateTime, TimeRange } from '../utils/time.types'

/* ========== Configuración de Simulación ========== */

/**
 * Configuración principal de la simulación
 */
export type SimConfig = {
  /** Inicio de la simulación en UTC (ISO) — p.ej. '2025-01-01T00:00:00Z' */
  startDateISO: ISODateTime
  /** Cantidad de días a simular (p.ej., 7 para 1 semana) */
  days: number
  /** Escala de tiempo: 60 => 1s tiempo real = 1min sim */
  timeScale: number
  /** Ventana (minutos) para aplicar capacidad de aeropuerto (p.ej. 60) */
  airportCapacityWindowMin: number
}

/**
 * Controles de reproducción de tiempo (para UI)
 */
export type TimeControls = {
  playing: boolean
  setPlaying: (v: boolean) => void
  timeScale: number
  setTimeScale: (scale: number) => void
  /** Reset sim-time al inicio de la ventana */
  reset: () => void
}

export type { TimeRange }
