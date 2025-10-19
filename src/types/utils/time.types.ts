/* ========== Utilitarios de Tiempo y IDs "marcados" (brand types) ========== */

/** Código ICAO de aeropuerto (p.ej. 'SPIM', 'EBCI', 'UBBB') */
export type AirportCode = string & { __brand: 'AirportCode' }

/** ID de vuelo en formato 'ORI-DES-HH:MM' */
export type FlightId = string & { __brand: 'FlightId' }

/** ID de cliente con 7 dígitos con padding */
export type ClientId = string & { __brand: 'ClientId' }

/** Fecha y hora en formato ISO 8601 '2025-01-01T00:00:00Z' */
export type ISODateTime = string & { __brand: 'ISODateTime' }

/** Hora en formato 'HH:MM' (00..23:00..59) */
export type HHMM = `${number extends 0|1|2 ? number : number}${number}:${number}${number}` | string

/** Día del mes con 2 dígitos ('01'..'31') */
export type DayDD = string

/** Milisegundos desde epoch UTC */
export type UTCMillis = number

/** Rango de tiempo con inicio y fin */
export type TimeRange = {
  start: Date
  end: Date
}
