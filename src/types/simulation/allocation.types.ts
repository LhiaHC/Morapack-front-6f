import type { AirportCode, FlightId } from '../utils/time.types'
import type { FlightLoad } from '../domain/flight.types'
import type { OrderAssignment } from './assignment.types'

/* ========== Tipos de Asignación/Alocación ========== */

/**
 * Ventana de capacidad de aeropuerto
 */
export type AirportCapacityWindow = {
  /** Clave horaria/ventana (por ejemplo YYYY-M-D-H o epoch-bucket) */
  bucketKey: string
  used: number
  limit: number
}

/**
 * Resultado de alocación de pedidos a vuelos
 */
export type AllocationResult = {
  /** Resultados por pedido */
  perOrder: OrderAssignment[]
  /** Carga por vuelo */
  perFlight: Record<FlightId, FlightLoad>
  /** Uso por aeropuerto/ventana */
  perAirportWindow: Record<AirportCode, Record<string, AirportCapacityWindow>>
}
