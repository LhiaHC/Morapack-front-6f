/**
 * Carga de datos EXCLUSIVAMENTE desde API backend
 * NO usa archivos JSON locales - solo API
 */

import type {
  AirportICAO,
  FlightInstance,
  AssignmentByOrder,
  TimelineEvent
} from '../types'
import { UploadService } from '../services/api'

/**
 * Carga aeropuertos SOLO desde la API del backend
 * Si no hay datos en la API, retorna array vacío
 */
export async function loadAirports(): Promise<AirportICAO[]> {
  try {
    console.log('🔄 Cargando aeropuertos desde API backend...')
    const response = await UploadService.getAllAirports()

    console.log('📊 Respuesta de API aeropuertos:', response)

    if (response.data && Array.isArray(response.data)) {
      if (response.data.length > 0) {
        console.log(`✅ Aeropuertos cargados desde API: ${response.data.length} registros`)
        console.log('📍 Primer aeropuerto:', response.data[0])
      } else {
        console.log('ℹ️ API respondió con array vacío. No hay aeropuertos cargados en el backend.')
      }
      return response.data
    }

    console.warn('⚠️ Formato inesperado de API, retornando array vacío')
    console.warn('Datos recibidos:', response.data)
    return []
  } catch (error) {
    console.error('❌ Error al cargar aeropuertos desde API:', error)
    console.error('⚠️ Retornando array vacío. El mapa estará sin aeropuertos.')
    return []
  }
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
