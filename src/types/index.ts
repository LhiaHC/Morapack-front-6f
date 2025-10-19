/* ============================================================
 * Tipos centralizados del proyecto MoraPack
 * ============================================================
 * Exportaciones organizadas por dominio para facilitar el uso
 * ============================================================ */

// ========== Utilidades y Tiempo ==========
export type {
  AirportCode,
  FlightId,
  ClientId,
  ISODateTime,
  HHMM,
  DayDD,
  UTCMillis,
  TimeRange,
} from './utils/time.types'

// ========== Dominio ==========
export type {
  Airport,
  AirportICAO,
} from './domain/airport.types'

export type {
  FlightDef,
  ScheduledFlight,
  FlightInstance,
  FlightLoad,
  FlightDTO,
} from './domain/flight.types'

export type {
  Order,
  OrderStatus,
} from './domain/order.types'

export type {
  Cancellation,
} from './domain/cancellation.types'

// ========== Simulación ==========
export type {
  SimConfig,
  TimeControls,
} from './simulation/config.types'

export type {
  AssignmentLeg,
  LineRef,
  AssignmentSplit,
  AssignmentByOrder,
  OrderAssignment,
  FlightSplit,
  TimelineEvent,
} from './simulation/assignment.types'

export type {
  AirportCapacityWindow,
  AllocationResult,
} from './simulation/allocation.types'

export type {
  SimTelemetry,
  DailyFlightPlan,
  WeeklyPlan,
} from './simulation/telemetry.types'

// ========== UI ==========
export type {
  LatLng,
  FlightMarkerState,
  RoutePolyline,
} from './ui/map.types'

export type {
  OpsStats,
} from './ui/stats.types'

// ========== API ==========
export type {
  SimInitResponse,
  SimRunResponse,
} from './api/dto.types'

export type {
  ApiError,
  ApiResult,
} from './api/response.types'
