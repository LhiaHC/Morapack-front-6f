import type { AirportCode, FlightId, HHMM, ISODateTime } from '../utils/time.types'

/* ========== Tipos de Vuelos ========== */

/**
 * Definición de vuelo base (diario, repetible)
 */
export type FlightDef = {
  /** Identificador base diario: ORI-DES-HH:MM (hora local origen) */
  id: FlightId
  from: AirportCode
  to: AirportCode
  /** Hora local de salida/llegada (no-UTC) */
  depLocal: HHMM
  arrLocal: HHMM
  capacity: number         // capacidad máxima (unidades/cajas)
}

/**
 * Vuelo programado con fechas específicas (simulación)
 */
export type ScheduledFlight = {
  id: FlightId
  from: AirportCode
  to: AirportCode
  /** Instantes en UTC dentro de la ventana simulada */
  dep: Date
  arr: Date
  capacity: number
  /** Carga asignada en la simulación (se setea en runtime) */
  loaded?: number
}

/**
 * Instancia de vuelo programado (con código ICAO)
 */
export type FlightInstance = {
  instanceId: string       // e.g., "MP-101#2025-10-20T00:00Z"
  flightId?: string        // e.g., "MP-101"
  origin: string           // ICAO code
  dest: string             // ICAO code
  depUtc: string           // ISO datetime
  arrUtc: string           // ISO datetime
  capacity: number
}

/**
 * Información de carga de un vuelo
 */
export type FlightLoad = {
  flightId: FlightId
  loaded: number
  remainingCapacity: number
}

/**
 * DTO de vuelo para API/servicios
 */
export type FlightDTO = {
  id: FlightId
  from: AirportCode
  to: AirportCode
  lat: number
  lng: number
  etd: ISODateTime
  eta: ISODateTime
}
