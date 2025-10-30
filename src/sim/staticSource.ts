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
 * Carga instancias de vuelos desde la API del backend
 * GET /api/vuelos/instances2 (con paginación)
 */
export async function loadInstances(): Promise<FlightInstance[]> {
  try {
    console.log('🔄 Cargando instancias de vuelos desde API backend...')
    
    // Usar UploadService.getFlightInstances que llama a /api/vuelos/instances2
    const response = await UploadService.getFlightInstances(0, 50000)

    console.log('📊 Respuesta de API instancias (raw):', response)
    console.log('📊 response.data:', response.data)

    // El backend retorna: { status, mensaje, data: { vuelos: [...], totalItems: N } }
    // Necesitamos acceder a data.data.vuelos
    let instances: FlightInstance[] = []

    if (response.data?.data?.vuelos) {
      // Formato: { data: { vuelos: [...] } }
      instances = response.data.data.vuelos
      console.log(`✅ Instancias de vuelos desde data.data.vuelos: ${instances.length} registros`)
    } else if (response.data?.vuelos) {
      // Formato alternativo: { vuelos: [...] }
      instances = response.data.vuelos
      console.log(`✅ Instancias de vuelos desde vuelos: ${instances.length} registros`)
    } else if (Array.isArray(response.data)) {
      // Formato directo: [...]
      instances = response.data
      console.log(`✅ Instancias de vuelos (array directo): ${instances.length} registros`)
    } else {
      console.warn('⚠️ Formato inesperado de API instancias')
      console.warn('Estructura recibida:', JSON.stringify(response.data, null, 2))
      return []
    }

    if (instances.length > 0) {
      console.log('✈️ Primera instancia:', instances[0])
      console.log('✈️ Última instancia:', instances[instances.length - 1])
    } else {
      console.warn('⚠️ No se encontraron instancias de vuelos')
    }

    return instances
  } catch (error) {
    console.error('❌ Error al cargar instancias de vuelos desde API:', error)
    console.error('⚠️ Retornando array vacío.')
    return []
  }
}

/**
 * Carga asignaciones por pedido (split-aware) desde la API del backend
 * GET /api/asignaciones
 */
export async function loadAssignmentsSplit(): Promise<AssignmentByOrder[]> {
  try {
    console.log('🔄 Cargando asignaciones desde API backend...')
    
    // Usar UploadService.getAssignments que llama a /api/asignaciones
    const response = await UploadService.getAssignments()

    console.log('📊 Respuesta de API asignaciones:', response)

    // El backend retorna: { status, mensaje, data: { assignments: [...] } }
    let assignments: AssignmentByOrder[] = []

    if (response.data?.data?.assignments) {
      // Formato: { data: { assignments: [...] } }
      assignments = response.data.data.assignments
      console.log(`✅ Asignaciones desde data.data.assignments: ${assignments.length} pedidos`)
    } else if (response.data?.assignments) {
      // Formato alternativo: { assignments: [...] }
      assignments = response.data.assignments
      console.log(`✅ Asignaciones desde assignments: ${assignments.length} pedidos`)
    } else if (Array.isArray(response.data)) {
      // Formato directo: [...]
      assignments = response.data
      console.log(`✅ Asignaciones (array directo): ${assignments.length} pedidos`)
    } else {
      console.warn('⚠️ Formato inesperado de API asignaciones')
      console.warn('Estructura recibida:', JSON.stringify(response.data, null, 2))
      return []
    }

    if (assignments.length > 0) {
      const planned = assignments.filter(a => a.splits && a.splits.length > 0).length
      console.log(`📦 ${assignments.length} pedidos totales (${planned} con planificación)`)
      console.log('📦 Primera asignación:', assignments[0])
    } else {
      console.warn('⚠️ No se encontraron asignaciones')
    }

    return assignments
  } catch (error) {
    console.error('❌ Error al cargar asignaciones desde API:', error)
    console.error('⚠️ Retornando array vacío.')
    return []
  }
}

/**
 * Carga eventos de timeline (opcional)
 * Por ahora retorna array vacío - se puede implementar endpoint específico si se necesita
 */
export async function loadTimeline(): Promise<TimelineEvent[]> {
  console.log('ℹ️ Timeline no implementado, retornando array vacío')
  return []
}

/**
 * Carga todos los datos necesarios para la simulación desde el backend
 * Equivalente al bundle anterior pero usando APIs individuales
 */
export async function loadBundle(): Promise<{
  airports: AirportICAO[]
  flight_instances: FlightInstance[]
  assignments_split: AssignmentByOrder[]
  timeline_split: TimelineEvent[]
}> {
  console.log('📦 Cargando bundle completo desde APIs del backend...')

  try {
    const [airports, flight_instances, assignments_split, timeline_split] = await Promise.all([
      loadAirports(),
      loadInstances(),
      loadAssignmentsSplit(),
      loadTimeline()
    ])

    console.log('✅ Bundle cargado exitosamente desde APIs:')
    console.log(`   - Aeropuertos: ${airports.length}`)
    console.log(`   - Instancias de vuelos: ${flight_instances.length}`)
    console.log(`   - Asignaciones: ${assignments_split.length}`)
    console.log(`   - Eventos timeline: ${timeline_split.length}`)

    return {
      airports,
      flight_instances,
      assignments_split,
      timeline_split
    }
  } catch (error) {
    console.error('❌ Error cargando bundle desde APIs:', error)
    throw error
  }
}
