import type { AirportCode } from '../utils/time.types'

/* ========== Tipos de Aeropuertos ========== */

/**
 * Aeropuerto (dominio base)
 */
export type Airport = {
  code: AirportCode
  tzOffset: number         // horas respecto a UTC (ej. -5 para Lima)
  capacity: number         // capacidad de procesamiento por ventana/hora
  lat: number
  lng: number
  name?: string
  country?: string
}

/**
 * Aeropuerto con código ICAO (para datos estáticos JSON)
 */
export type AirportICAO = {
  icao: string
  iata?: string
  name: string
  city?: string
  country?: string
  lat: number
  lon: number
  warehouseCapacity?: number
  infiniteSource?: boolean
}
