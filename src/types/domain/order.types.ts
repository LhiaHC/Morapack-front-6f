import type { AirportCode, ClientId } from '../utils/time.types'

/* ========== Tipos de Pedidos ========== */

/**
 * Estado de un pedido
 */
export type OrderStatus = 'pending' | 'in_flight' | 'delivered'

/**
 * Pedido (dominio base)
 */
export type Order = {
  day: number              // 1..31 (según archivo mensual)
  hh: number               // 0..23
  mm: number               // 0..59
  dest: AirportCode
  quantity: number         // 1..999
  clientId: ClientId
  status?: OrderStatus     // sólo para UI
}
