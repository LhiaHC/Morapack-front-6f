import type { Airport, AirportCode, Cancellation, ClientId, FlightDef, FlightId, HHMM, Order } from "./types"


async function fetchText(path: string): Promise<string> {
  const resp = await fetch(path)
  if (!resp.ok) throw new Error(`No se pudo leer ${path}`)
  return resp.text()
}

/** Convierte coordenadas en DMS (ej. 12°01'19"S) a decimal. */
function dmsToDec(input: string): number {
  // Quita espacios y normaliza comillas
  const s = input.trim().replace(/\s+/g, ' ')
  // Soporta: 12°01'19"S  ó  12:01:19 S  ó  12 01 19 S
  const m =
    s.match(/(\d{1,3})[°:\s]+(\d{1,2})[\':\s]*(\d{1,2}(?:\.\d+)?)?["]?\s*([NSEW])/i) ||
    s.match(/(\d{1,3})[^\d]+(\d{1,2})[^\d]+(\d{1,2}(?:\.\d+)?)?\s*([NSEW])/i)

  if (!m) {
    // Fallback: intenta como decimal simple
    const n = parseFloat(s)
    return Number.isFinite(n) ? n : 0
  }

  const deg = parseFloat(m[1])
  const min = parseFloat(m[2] || '0')
  const sec = parseFloat(m[3] || '0')
  const hemi = m[4].toUpperCase()

  let dec = deg + min / 60 + sec / 3600
  if (hemi === 'S' || hemi === 'W') dec = -dec
  return dec
}

/** Normaliza un código de aeropuerto. */
const normCode = (c: string) => String(c).trim().toUpperCase() as AirportCode

/** =================== AIRPORTS ===================
 * Formato real (CSV): idx, CODE, Ciudad, País, alias, tz, capacidad, Lat(DMS), Lon(DMS), Región
 * Ej: 05,SPIM,Lima,Perú,lima,-5,440,12°01'19"S,77°06'52"W,AM
 * (También soporta fallback "CODE LAT LON" en una línea)
 */
export async function parseAirports(path: string): Promise<Record<AirportCode, Airport>> {
  const txt = await fetchText(path)
  const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const airports: Record<AirportCode, Airport> = {}

  for (const line of lines) {
    if (line.includes(',')) {
      const p = line.split(',').map(s => s.trim())
      if (p.length < 9) continue
      const code = p[1].toUpperCase() as AirportCode
      const tzOffset = parseInt(p[5], 10)
      const capacity = parseInt(p[6], 10)
      const lat = dmsToDec(p[7])
      const lng = dmsToDec(p[8])

      airports[code] = { code, tzOffset: Number.isFinite(tzOffset) ? tzOffset : 0, capacity: Number.isFinite(capacity) ? capacity : 0, lat, lng }
    } else {
      const m = line.match(/^([A-Z0-9]{3,4})\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)$/i)
      if (!m) continue
      const code = m[1].toUpperCase() as AirportCode
      airports[code] = { code, tzOffset: -5, capacity: 100, lat: parseFloat(m[2]), lng: parseFloat(m[3]) }
    }
  }
  return airports
}


/** =================== FLIGHTS ===================
 * Formato real (CSV): ORI,DES,DEP,ARR,CAP — :contentReference[oaicite:5]{index=5}
 * Ej: SKBO,SEQM,03:34,05:21,0300
 * También soporta el formato antiguo: ORI-DES-DEP-ARR-CAP
 */
export async function parseFlightDefs(path: string): Promise<FlightDef[]> {
  const txt = await fetchText(path)
  const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const out: FlightDef[] = []

  for (const l of lines) {
    let from: AirportCode, to: AirportCode, depLocal: HHMM, arrLocal: HHMM, cap: number

    if (l.includes(',')) {
      const [f,t,dep,arr,c] = l.split(',').map(s => s.trim())
      from = f.toUpperCase() as AirportCode
      to   = t.toUpperCase() as AirportCode
      depLocal = dep as HHMM
      arrLocal = arr as HHMM
      cap = parseInt(c,10)
    } else {
      const m = l.match(/^([A-Z0-9]{3,4})-([A-Z0-9]{3,4})-([0-2]\d:[0-5]\d)-([0-2]\d:[0-5]\d)-(\d{3,4})$/i)
      if (!m) throw new Error(`Vuelo inválido: ${l}`)
      from = m[1].toUpperCase() as AirportCode
      to   = m[2].toUpperCase() as AirportCode
      depLocal = m[3] as HHMM
      arrLocal = m[4] as HHMM
      cap = parseInt(m[5],10)
    }

    if (!/^[0-2]\d:[0-5]\d$/.test(depLocal) || !/^[0-2]\d:[0-5]\d$/.test(arrLocal)) continue

    out.push({
      id: `${from}-${to}-${depLocal}` as FlightId,
      from, to, depLocal, arrLocal, capacity: cap
    })
  }
  return out
}


/** =================== CANCELLATIONS ===================
 * Formato: dd.ORI-DEST-HH:MM — :contentReference[oaicite:6]{index=6}
 */
export async function parseCancellations(path: string): Promise<Cancellation[]> {
  const txt = await fetchText(path)
  return txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => {
    const m = l.match(/^(\d{2})\.([A-Z0-9]{3,4}-[A-Z0-9]{3,4}-[0-2]\d:[0-5]\d)$/i)
    if (!m) throw new Error(`Cancelación inválida: ${l}`)
    return { day: parseInt(m[1],10), id: m[2].toUpperCase() as FlightId }
  })
}

export async function parseOrders(path: string): Promise<Order[]> {
  const txt = await fetchText(path)
  return txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => {
    const m = l.match(/^(\d{2})-(\d{2})-(\d{2})-([A-Z0-9]{3,4})-(\d{3})-(\d{7})$/i)
    if (!m) throw new Error(`Pedido inválido: ${l}`)
    const [, dd, hh, mm, dest, qty, clientId] = m
    return { day: +dd, hh: +hh, mm: +mm, dest: dest.toUpperCase() as AirportCode, quantity: +qty, clientId: clientId as ClientId }
  })
}
