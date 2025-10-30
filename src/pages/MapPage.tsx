import { useEffect, useState, useCallback } from 'react'
import MapView from "../components/map/MapView"
import SimControls from '../components/sim/SimControls'
import OrderPanel from '../components/OrderPanel'
import { SimProvider, useSimulation } from '../sim/SimContext'
import { useUpload } from '../layouts/DashboardLayout'
import {
  loadAirports,
  loadInstances,
  loadAssignmentsSplit,
  loadTimeline
} from '../sim/staticSource'
import { PlanningService } from '../services/api'
import type {
  AirportICAO,
  FlightInstance,
  AssignmentByOrder,
  TimelineEvent
} from '../types'

function MapPageContent() {
  const [airports, setAirports] = useState<AirportICAO[]>([])
  const [instances, setInstances] = useState<FlightInstance[]>([])
  const [assignments, setAssignments] = useState<AssignmentByOrder[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [simulationStarted, setSimulationStarted] = useState(false)
  const [planningLoading, setPlanningLoading] = useState(false)
  const { setMinTime, setMaxTime, setSimTime } = useSimulation()
  const { setUploadOpen, dataAlreadyLoaded } = useUpload()

  // Función para cargar datos básicos (aeropuertos, vuelos, pedidos)
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 MapPage: Cargando datos desde API...')

      const [airportsData, instancesData, assignmentsData, timelineData] = await Promise.all([
        loadAirports(),
        loadInstances(),
        loadAssignmentsSplit(),
        loadTimeline()
      ])

      console.log('📍 MapPage: Aeropuertos cargados:', airportsData.length)
      console.log('✈️ MapPage: Instancias cargadas:', instancesData.length)

      setAirports(airportsData)
      setInstances(instancesData)
      setAssignments(assignmentsData)
      setTimeline(timelineData)
      setDataLoaded(true)

      // Calcular rango de tiempo desde las instancias
      if (instancesData.length > 0) {
        const times = instancesData.flatMap(i => [
          new Date(i.depUtc).getTime(),
          new Date(i.arrUtc).getTime()
        ])
        const min = new Date(Math.min(...times))
        const max = new Date(Math.max(...times))

        setMinTime(min)
        setMaxTime(max)
        setSimTime(min)
      }

      setLoading(false)
    } catch (err) {
      console.error('❌ MapPage: Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load simulation data')
      setLoading(false)
    }
  }, [setMinTime, setMaxTime, setSimTime])

  // Función para iniciar la simulación con planificación
  const startSimulation = useCallback(async () => {
    try {
      setPlanningLoading(true)
      setError(null)

      console.log('🚀 MapPage: Iniciando simulación con planificación...')

      // Llamar a la API de planificación
      const response = await PlanningService.getWeeklyPlanning()

      console.log('📊 MapPage: Respuesta de planificación:', response)

      // Procesar la respuesta de planificación
      // Dependiendo del formato de la respuesta, actualizar la estructura de datos
      if (response.data) {
        // Aquí procesamos la respuesta de planificación
        // El formato exacto depende de lo que retorne el backend
        // Por ahora asumimos que retorna la misma estructura que loadAssignmentsSplit

        let planningData: AssignmentByOrder[] = []

        if (response.data.data?.assignments) {
          planningData = response.data.data.assignments
        } else if (response.data.assignments) {
          planningData = response.data.assignments
        } else if (Array.isArray(response.data)) {
          planningData = response.data
        }

        console.log('📦 MapPage: Planificación procesada:', planningData.length, 'pedidos')

        // Actualizar assignments con los datos de planificación
        if (planningData.length > 0) {
          setAssignments(planningData)
        }
      }

      setSimulationStarted(true)
      setPlanningLoading(false)

      console.log('✅ MapPage: Simulación iniciada exitosamente')
    } catch (err) {
      console.error('❌ MapPage: Error al iniciar simulación:', err)
      setError(err instanceof Error ? err.message : 'Failed to start simulation')
      setPlanningLoading(false)
    }
  }, [])

  // Función para cerrar la simulación y volver al estado inicial
  const closeSimulation = useCallback(() => {
    setSimulationStarted(false)
    console.log('🔙 MapPage: Simulación cerrada, volviendo a vista inicial')
  }, [])

  // Listener para refrescar SOLO cuando la carga completa termine
  useEffect(() => {
    const handleUploadComplete = () => {
      console.log('🎉 MapPage: Carga completa detectada, refrescando mapa...')
      loadData()
    }

    window.addEventListener('upload-complete', handleUploadComplete)

    return () => {
      window.removeEventListener('upload-complete', handleUploadComplete)
    }
  }, [loadData])

  // NO cargar datos automáticamente - esperar a que el usuario haga clic en "Cargar Datos"

  return (
    <div className="relative w-full h-screen bg-neutral-custom-50">
      <MapView
        airports={airports}
        instances={instances}
        assignments={assignments}
        timeline={timeline}
        selectedOrderId={selectedOrderId}
      />
      <OrderPanel
        assignments={assignments}
        instances={instances}
        timeline={timeline}
        onOrderSelect={setSelectedOrderId}
        selectedOrderId={selectedOrderId}
      />

      {/* SimControls solo se muestra si la simulación ha sido iniciada */}
      {simulationStarted && <SimControls onClose={closeSimulation} />}

      {/* Botones de control - ocupan el mismo espacio que SimControls cuando este no está visible */}
      {!simulationStarted && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[45] flex items-center justify-center gap-3 px-4 backdrop-blur-sm">
          {/* Botón 1: Cargar Datos (abrir diálogo upload - los datos se visualizan automáticamente) */}
          <button
            onClick={() => setUploadOpen(true)}
            disabled={dataAlreadyLoaded}
            className="h-11 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-2 rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-[250ms] hover:shadow-[0_4px_8px_rgba(0,0,0,0.15)] active:scale-98"
            title={dataAlreadyLoaded ? "Los datos ya han sido cargados y están visibles en el mapa" : "Cargar archivos al backend y visualizar en el mapa"}
            style={{ fontFamily: 'Poppins, Inter, sans-serif' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span>{dataAlreadyLoaded ? '✅ Datos cargados' : 'Cargar Datos'}</span>
          </button>

          {/* Botón 2: Iniciar Simulación (planificación + simulación) */}
          <button
            onClick={startSimulation}
            disabled={!dataAlreadyLoaded || planningLoading}
            className="h-11 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-2 rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-[250ms] hover:shadow-[0_4px_8px_rgba(0,0,0,0.15)] active:scale-98"
            title="Ejecutar planificación e iniciar simulación"
            style={{ fontFamily: 'Poppins, Inter, sans-serif' }}
          >
            {planningLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            <span>{planningLoading ? 'Planificando...' : 'Iniciar Simulación'}</span>
          </button>
        </div>
      )}

      {/* Indicador de aeropuertos */}
      {airports.length > 0 ? (
        <div className="absolute top-20 left-4 z-10 bg-white text-neutral-custom-800 px-4 py-2 rounded-lg shadow-md border border-neutral-custom-200">
          <div className="text-sm font-medium">
            📍 {airports.length} aeropuertos
            {airports.filter(a => a.infiniteSource).length > 0 && (
              <span className="ml-2 text-teal-600">
                ⭐ {airports.filter(a => a.infiniteSource).length} HUBs
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="absolute top-20 left-4 z-10 bg-amber-50 text-amber-800 px-4 py-3 rounded-lg shadow-md border border-amber-200">
          <div className="text-sm font-medium mb-1">⚠️ No hay datos cargados</div>
          <div className="text-xs">
            Use el botón "Cargar Datos" para cargar información desde el backend
          </div>
        </div>
      )}

      {/* Mensaje de error flotante */}
      {error && (
        <div className="absolute top-20 right-4 z-10 bg-red-50 text-red-800 px-4 py-3 rounded-lg shadow-md border border-red-200 max-w-md">
          <div className="text-sm font-medium mb-1">❌ Error</div>
          <div className="text-xs">{error}</div>
        </div>
      )}
    </div>
  )
}

export default function MapPage() {
  return (
    <SimProvider>
      <MapPageContent />
    </SimProvider>
  )
}
