/**
 * Carga de datos estáticos desde JSON en /public
 * Todos los datos usan códigos ICAO exclusivamente (SPIM, EBCI, UBBB, etc.)
 */

import type { 
  AirportICAO, 
  FlightInstance, 
  AssignmentByOrder, 
  TimelineEvent 
} from './types'

/**
 * Carga aeropuertos desde /public/airports_icao.json
 */
export async function loadAirports(): Promise<AirportICAO[]> {
  const response = await fetch('/airports_icao.json')
  if (!response.ok) {
    throw new Error(`Failed to load airports: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Carga instancias de vuelos desde /public/flight_instances_icao.json
 */
export async function loadInstances(): Promise<FlightInstance[]> {
  const response = await fetch('/flight_instances_icao.json')
  if (!response.ok) {
    throw new Error(`Failed to load flight instances: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Carga asignaciones por pedido (split-aware) desde /public/assignments_split_icao.json
 */
export async function loadAssignmentsSplit(): Promise<AssignmentByOrder[]> {
  const response = await fetch('/assignments_split_icao.json')
  if (!response.ok) {
    throw new Error(`Failed to load assignments: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Carga eventos de timeline (opcional) desde /public/timeline_split_icao.json
 * Si el archivo no existe, retorna array vacío
 */
export async function loadTimeline(): Promise<TimelineEvent[]> {
  try {
    const response = await fetch('/timeline_split_icao.json')
    if (!response.ok) {
      console.warn('Timeline file not found, using empty timeline')
      return []
    }
    return response.json()
  } catch (error) {
    console.warn('Failed to load timeline, using empty timeline:', error)
    return []
  }
}

/**
 * Alternativa: carga todo desde un único archivo bundle
 */
export async function loadBundle(): Promise<{
  airports: AirportICAO[]
  flight_instances: FlightInstance[]
  assignments_split: AssignmentByOrder[]
  timeline_split: TimelineEvent[]
}> {
  const response = await fetch('/bundle_split_icao.json')
  if (!response.ok) {
    throw new Error(`Failed to load bundle: ${response.statusText}`)
  }
  return response.json()
}
