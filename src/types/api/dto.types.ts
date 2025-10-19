import type { Airport } from '../domain/airport.types'
import type { AirportCode } from '../utils/time.types'
import type { FlightDef } from '../domain/flight.types'
import type { SimConfig } from '../simulation/config.types'
import type { AllocationResult } from '../simulation/allocation.types'
import type { SimTelemetry } from '../simulation/telemetry.types'
import type { ScheduledFlight } from '../domain/flight.types'

/* ========== Tipos de API / DTOs ========== */

/**
 * Respuesta de inicialización de simulación
 */
export type SimInitResponse = {
  config: SimConfig
  airports: Record<AirportCode, Airport>
  flights: FlightDef[]
}

/**
 * Respuesta de ejecución de simulación
 */
export type SimRunResponse = {
  schedule: ScheduledFlight[]
  allocation: AllocationResult
  telemetry: SimTelemetry
}
