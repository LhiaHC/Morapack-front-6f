/* ============================================================
 * Tipos globales del proyecto MoraPack (UI + Simulación)
 * ============================================================
 * - Dominio: Aeropuertos, Vuelos, Pedidos, Cancelaciones
 * - Simulación: Config, Programación de vuelos, Asignaciones, Carga
 * - UI / Mapa: Marcadores, Polilíneas, Controles de tiempo
 * - API: DTOs y respuestas de servicios
 * - Utilitarios: Branded IDs y helpers de tiempo
 * ============================================================ */

/* ========== Utilitarios y IDs “marcados” (brand types) ========== */

export type AirportCode = string & { __brand: 'AirportCode' }      // p.ej. 'SPIM', 'SVMI'
export type FlightId    = string & { __brand: 'FlightId' }         // 'ORI-DES-HH:MM'
export type ClientId    = string & { __brand: 'ClientId' }         // 7 dígitos con padding
export type ISODateTime = string & { __brand: 'ISODateTime' }      // '2025-01-01T00:00:00Z'

/** Hora en formato 'HH:MM' (00..23:00..59) */
export type HHMM = `${number extends 0|1|2 ? number : number}${number}:${number}${number}` | string

/** Día del mes con 2 dígitos ('01'..'31') */
export type DayDD = string

/* ======================= Dominio base ======================= */

export type Airport = {
  code: AirportCode
  tzOffset: number         // horas respecto a UTC (ej. -5 para Lima)
  capacity: number         // capacidad de procesamiento por ventana/hora (UI)
  lat: number
  lng: number
  name?: string            // opcional
  country?: string         // opcional
}

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

export type Cancellation = {
  /** Día del mes (1..31) como número */
  day: number
  /** ID de vuelo en formato ORI-DES-HH:MM (hora local salida) */
  id: FlightId
}

export type OrderStatus = 'pending' | 'in_flight' | 'delivered'

export type Order = {
  day: number              // 1..31 (según archivo mensual)
  hh: number               // 0..23
  mm: number               // 0..59
  dest: AirportCode
  quantity: number         // 1..999
  clientId: ClientId
  status?: OrderStatus     // sólo para UI
}

/* ======================= Simulación ======================== */

export type SimConfig = {
  /** Inicio de la simulación en UTC (ISO) — p.ej. '2025-01-01T00:00:00Z' */
  startDateISO: ISODateTime
  /** Cantidad de días a simular (p.ej., 7 para 1 semana) */
  days: number
  /** Escala de tiempo: 60 => 1s tiempo real = 1min sim */
  timeScale: number
  /** Ventana (minutos) para aplicar capacidad de aeropuerto (p.ej. 60) */
  airportCapacityWindowMin: number
}

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

export type FlightLoad = {
  flightId: FlightId
  loaded: number
  remainingCapacity: number
}

export type AirportCapacityWindow = {
  /** Clave horaria/ventana (por ejemplo YYYY-M-D-H o epoch-bucket) */
  bucketKey: string
  used: number
  limit: number
}

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

export type AllocationResult = {
  /** Resultados por pedido */
  perOrder: OrderAssignment[]
  /** Carga por vuelo */
  perFlight: Record<FlightId, FlightLoad>
  /** Uso por aeropuerto/ventana */
  perAirportWindow: Record<AirportCode, Record<string, AirportCapacityWindow>>
}

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

/* ======================= UI / Mapa ========================= */

export type LatLng = { lat: number; lng: number }

export type FlightMarkerState = {
  id: FlightId
  position: LatLng
  active: boolean           // en ruta (true) o en origen/destino (false)
  /** 0..1 porcentaje de avance del trayecto (sólo para UI) */
  progress?: number
  /** 0..1 nivel de ocupación del vuelo (loaded/capacity) */
  loadFactor?: number
}

export type RoutePolyline = {
  id: string                // único por (id de vuelo + día) si lo necesitas
  from: LatLng
  to: LatLng
  /** Color o estilo sugerido (UI); opcional */
  color?: string
}

/** Controles de reproducción de tiempo (para Topbar/Settings) */
export type TimeControls = {
  playing: boolean
  setPlaying: (v: boolean) => void
  timeScale: number
  setTimeScale: (scale: number) => void
  /** Reset sim-time al inicio de la ventana */
  reset: () => void
}

/* ======================= API / Servicios =================== */

export type OpsStats = {
  flights: number
  orders: number
  etaDelays: number
}

export type FlightDTO = {
  id: FlightId
  from: AirportCode
  to: AirportCode
  lat: number
  lng: number
  etd: ISODateTime
  eta: ISODateTime
}

/* Respuestas de servicios de simulación (si el backend las expone) */
export type SimInitResponse = {
  config: SimConfig
  airports: Record<AirportCode, Airport>
  flights: FlightDef[]
}

export type SimRunResponse = {
  schedule: ScheduledFlight[]
  allocation: AllocationResult
  telemetry: SimTelemetry
}

/* ======================= Helpers de tiempo ================= */

export type UTCMillis = number

export type TimeRange = {
  start: Date
  end: Date
}

/* ======== Errores / Resultados estándar (útil para API) ==== */

export type ApiError = {
  code: string
  message: string
  details?: Record<string, unknown>
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }

// --- Planificación diaria de carga (simulada) ---
export type FlightSplit = {
  orderClientId: ClientId
  dest: AirportCode
  qty: number
}

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

export type WeeklyPlan = Record<string, DailyFlightPlan[]> // date -> vuelos de ese día
