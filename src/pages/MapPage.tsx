import { useEffect, useState, useCallback } from 'react'
import MapView from "../components/map/MapView"
import SimControls from '../components/sim/SimControls'
import OrderPanel from '../components/OrderPanel'
import { SimProvider, useSimulation } from '../sim/SimContext'
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
    <div className="relative w-full h-screen">
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
      {simulationStarted && <SimControls />}

      {/* Botones de control - ocupan el mismo espacio que SimControls cuando este no está visible */}
      {!simulationStarted && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[45] w-full max-w-4xl px-4">
          <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-gray-200/50 p-4">
            <div className="flex items-center justify-center gap-3">
              {/* Botón Cargar Datos */}
              <button
                onClick={loadData}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium active:scale-95"
                title="Cargar aeropuertos, vuelos y pedidos desde el backend"
              >
                <span className={loading ? 'animate-spin' : ''}>📥</span>
                {loading ? 'Cargando...' : 'Cargar Datos'}
              </button>

              {/* Botón Iniciar Simulación - solo se habilita si hay datos cargados */}
              <button
                onClick={startSimulation}
                disabled={!dataLoaded || planningLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium active:scale-95"
                title="Ejecutar planificación e iniciar simulación"
              >
                <span className={planningLoading ? 'animate-spin' : ''}>🚀</span>
                {planningLoading ? 'Planificando...' : 'Iniciar Simulación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de aeropuertos */}
      {airports.length > 0 ? (
        <div className="absolute top-20 left-4 z-[1000] bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <div className="text-sm font-medium">
            📍 {airports.length} aeropuertos
            {airports.filter(a => a.infiniteSource).length > 0 && (
              <span className="ml-2 text-orange-600">
                ⭐ {airports.filter(a => a.infiniteSource).length} HUBs
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="absolute top-20 left-4 z-[1000] bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg shadow-lg border border-yellow-200">
          <div className="text-sm font-medium mb-1">⚠️ No hay datos cargados</div>
          <div className="text-xs">
            Use el botón "Cargar Datos" para cargar información desde el backend
          </div>
        </div>
      )}

      {/* Mensaje de error flotante */}
      {error && (
        <div className="absolute top-20 right-4 z-[1000] bg-red-50 text-red-800 px-4 py-3 rounded-lg shadow-lg border border-red-200 max-w-md">
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
