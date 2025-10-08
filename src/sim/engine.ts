import type { 
  Airport, 
  AirportCode, 
  ClientId, 
  FlightDef,
  FlightId,
  HHMM, 
  Order, 
  ScheduledFlight, 
  WeeklyPlan
} from "./types"

function localToUTC(baseUTC: Date, hhmm: HHMM, tzOffset: number, dayOffset: number): Date {
  const [hh, mm] = hhmm.split(':').map(Number)
  const d = new Date(baseUTC)
  d.setUTCDate(d.getUTCDate() + dayOffset)
  // local = UTC + tz  ⇒  UTC = local - tz
  d.setUTCHours(hh - (tzOffset ?? 0), mm, 0, 0)
  return d
}

const norm = (s: string) => String(s).trim().toUpperCase()

/** Construye programación UTC para N días, aplicando cancelaciones dd.ID */
export function buildSchedule(
  startDateISO: string,
  days: number,
  flights: FlightDef[],
  airports: Record<AirportCode, Airport>,
  cancellations: {day: number, id: FlightId}[]
): ScheduledFlight[] {
  const start = new Date(startDateISO)
  const cancelKeys = new Set(cancellations.map(c => `${String(c.day).padStart(2,'0')}-${norm(c.id)}`))
  const out: ScheduledFlight[] = []

  for (let d = 0; d < days; d++) {
    for (const f of flights) {
      const from = norm(f.from) as AirportCode
      const to = norm(f.to) as AirportCode
      const ori = airports[from]
      const des = airports[to]
      if (!ori || !des) continue

      const depUTC = localToUTC(start, f.depLocal, ori.tzOffset, d)
      const arrUTC = localToUTC(start, f.arrLocal, des.tzOffset, d)
      const cancelKey = `${String(d+1).padStart(2,'0')}-${norm(f.id)}`
      if (cancelKeys.has(cancelKey)) continue 

      out.push({
        id: `${from}-${to}-${f.depLocal}` as FlightId,
        from: from as AirportCode,
        to: to as AirportCode,
        dep: depUTC,
        arr: arrUTC,
        capacity: f.capacity,
        loaded: 0,
      })
    }
  }
  return out
}

/** Posición interpolada y estado activo de un vuelo en el instante t */
export function positionAt(
  f: ScheduledFlight, 
  t: Date,
  airports: Record<AirportCode, Airport>
): {lat: number, lng: number, active: boolean, loadFactor?: number} {
  const a = f.dep.getTime()
  const b = f.arr.getTime()
  const x = t.getTime()
  const A = airports[f.from]
  const B = airports[f.to]
  
  const loadFactor = f.loaded ? f.loaded / f.capacity : undefined

  if (!A || !B) {
    return { lat: 0, lng: 0, active: false, loadFactor }
  }
  if (x <= a) {
    return { lat: A.lat, lng: A.lng, active: false, loadFactor }
  }
  if (x >= b) {
    return { lat: B.lat, lng: B.lng, active: false, loadFactor }
  }

  const u = (x - a) / (b - a)
  return {
    lat: A.lat + (B.lat - A.lat) * u,
    lng: A.lng + (B.lng - A.lng) * u,
    active: true,
    loadFactor,
  }
}

// clave única por vuelo+fecha de salida (UTC)
const flightDayKey = (f: ScheduledFlight) => `${f.id}|${f.dep.toISOString().slice(0,10)}`

// Genera estructura vacía del plan para todos los vuelos programados
function seedPlan(schedule: ScheduledFlight[]): WeeklyPlan {
  const plan: WeeklyPlan = {}
  for (const f of schedule) {
    const date = f.dep.toISOString().slice(0,10)
    plan[date] ||= []
    plan[date].push({
      date,
      flightId: f.id,
      from: f.from,
      to: f.to,
      dep: f.dep,
      arr: f.arr,
      capacity: f.capacity,
      loaded: 0,
      splits: [],
    })
  }
  return plan
}

/**
 * Asigna pedidos a vuelos que llegan a su destino (greedy simple) y
 * construye un plan por día: qué lleva cada vuelo y de qué pedidos.
 * Respeta: capacidad de vuelo y capacidad horaria del aeropuerto destino.
 */
export function allocateOrdersToFlights(
  orders: Order[],
  schedule: ScheduledFlight[],
  airports: Record<string, Airport>
): WeeklyPlan {
  // plan “día a día”
  const plan = seedPlan(schedule)

  // buckets de capacidad por aeropuerto (llegadas por hora)
  const airportBucket: Record<string, Record<string, number>> = {}
  // carga por vuelo+día
  const flightLoads = new Map<string, number>() // key: flightDayKey

  // ordenar pedidos por tiempo de creación para asignar primero los más antiguos
  const ordersSorted = [...orders].sort((a,b) => (a.day - b.day) || (a.hh - b.hh) || (a.mm - b.mm))

  for (const o of ordersSorted) {
    let remaining = o.quantity
    // vuelos que lleguen al destino en el mismo mes (o después del momento del pedido)
    const candidate = schedule
      .filter(f => f.to === o.dest && f.arr.getUTCDate() >= o.day)
      .sort((a,b) => a.arr.getTime() - b.arr.getTime())

    for (const f of candidate) {
      if (remaining <= 0) break

      const slotKey = `${f.arr.getUTCFullYear()}-${f.arr.getUTCMonth()+1}-${f.arr.getUTCDate()}-${f.arr.getUTCHours()}`
      airportBucket[o.dest] ||= {}
      airportBucket[o.dest][slotKey] ||= 0

      const usedAirport = airportBucket[o.dest][slotKey]
      const canAirport = (airports[o.dest]?.capacity ?? Infinity) - usedAirport

      const k = flightDayKey(f)
      const usedFlight = flightLoads.get(k) || 0
      const canFlight = f.capacity - usedFlight

      if (canAirport <= 0 || canFlight <= 0) continue

      const boarded = Math.min(remaining, canFlight, canAirport)
      remaining -= boarded

      // Actualiza contadores
      airportBucket[o.dest][slotKey] += boarded
      flightLoads.set(k, usedFlight + boarded)
      f.loaded = (f.loaded || 0) + boarded

      // Escribe en el plan diario
      const date = f.dep.toISOString().slice(0,10)
      const dayPlan = plan[date]
      const p = dayPlan.find(x => x.flightId === f.id && x.dep.getTime() === f.dep.getTime())
      if (p) {
        p.loaded += boarded
        p.splits.push({ orderClientId: o.clientId as ClientId, dest: o.dest, qty: boarded })
      }
    }

    // Si quedarían remanentes, se podrían “backlogear” aquí (sim futura)
  }

  return plan
}
