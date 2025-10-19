import type { AirportCode, FlightId } from '../utils/time.types'
import type { FlightSplit } from './assignment.types'

/* ========== Tipos de Telemetría y Planificación ========== */

/**
 * Telemetría de simulación (KPIs y estadísticas)
 */
export type SimTelemetry = {
  /** Conteo de KPIs para Rightbar/estadísticas */
  totals: {
    flightsScheduled: number
    flightsCancelled: number
    orders: number
    unitsRequested: number
    unitsLoaded: number
    unitsLeftover: number
  }
}

/**
 * Plan diario de vuelo con carga asignada
 */
export type DailyFlightPlan = {
  date: string               // YYYY-MM-DD (UTC del dep)
  flightId: FlightId
  from: AirportCode
  to: AirportCode
  dep: Date
  arr: Date
  capacity: number
  loaded: number
  splits: FlightSplit[]      // cómo se compone la carga (por pedidos)
}

/**
 * Planificación semanal de vuelos
 * Mapa de fecha (YYYY-MM-DD) a vuelos de ese día
 */
export type WeeklyPlan = Record<string, DailyFlightPlan[]>
