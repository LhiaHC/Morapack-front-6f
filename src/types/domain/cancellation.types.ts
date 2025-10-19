import type { FlightId } from '../utils/time.types'

/* ========== Tipos de Cancelaciones ========== */

/**
 * Cancelación de vuelo en un día específico
 */
export type Cancellation = {
  /** Día del mes (1..31) como número */
  day: number
  /** ID de vuelo en formato ORI-DES-HH:MM (hora local salida) */
  id: FlightId
}
