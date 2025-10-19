import type { AirportCode, ClientId, FlightId } from '../utils/time.types'

/* ========== Tipos de Asignación y Splits ========== */

/**
 * Leg de un consignment (split)
 */
export type AssignmentLeg = {
  seq: number
  instanceId: string
  from: string             // ICAO code
  to: string               // ICAO code
  qty: number
}

/**
 * Line reference dentro de un split
 */
export type LineRef = {
  lineId: string
  qty: number
}

/**
 * Split de un pedido (consignment)
 */
export type AssignmentSplit = {
  consignmentId: string
  qty: number
  lineRefs?: LineRef[]
  legs: AssignmentLeg[]
}

/**
 * Asignaciones agrupadas por pedido
 */
export type AssignmentByOrder = {
  orderId: string
  splits: AssignmentSplit[]
}

/**
 * Asignación de pedido con vuelos específicos (simulación)
 */
export type OrderAssignment = {
  orderClientId: ClientId
  orderDay: number
  orderTimeHH: number
  orderTimeMM: number
  dest: AirportCode
  /** Empaques asignados a cada vuelo (puede repartirse en múltiples) */
  splits: Array<{ flightId: FlightId; qty: number }>
  /** Si queda remanente (no embarcado) */
  leftover?: number
}

/**
 * Split de vuelo con información de carga
 */
export type FlightSplit = {
  orderClientId: ClientId
  dest: AirportCode
  qty: number
}

/**
 * Evento de timeline para trazabilidad
 */
export type TimelineEvent = {
  ts: string               // ISO datetime
  type: 'WAIT_START' | 'WAIT_END' | 'LOAD' | 'ARRIVAL' | 'PICKUP_READY' | 'CANCELLATION'
  orderId: string
  consignmentId?: string
  instanceId?: string
  airport?: string         // ICAO code
  from?: string            // ICAO code
  to?: string              // ICAO code
  qty?: number
  at?: string              // ICAO code
}
