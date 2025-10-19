import { useEffect, useState } from 'react'
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
import type { 
  AirportICAO, 
  FlightInstance, 
  AssignmentByOrder, 
  TimelineEvent 
} from '../sim/types'

function MapPageContent() {
  const [airports, setAirports] = useState<AirportICAO[]>([])
  const [instances, setInstances] = useState<FlightInstance[]>([])
  const [assignments, setAssignments] = useState<AssignmentByOrder[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { setMinTime, setMaxTime, setSimTime } = useSimulation()

  // Cargar datos estáticos al montar
  useEffect(() => {
    async function loadData() {
      try {
        const [airportsData, instancesData, assignmentsData, timelineData] = await Promise.all([
          loadAirports(),
          loadInstances(),
          loadAssignmentsSplit(),
          loadTimeline()
        ])
        
        setAirports(airportsData)
        setInstances(instancesData)
        setAssignments(assignmentsData)
        setTimeline(timelineData)

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
          setSimTime(min) // Iniciar en el tiempo mínimo
        }

        setLoading(false)
      } catch (err) {
        console.error('Error loading simulation data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load simulation data')
        setLoading(false)
      }
    }

    loadData()
  }, [setMinTime, setMaxTime, setSimTime])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Cargando simulación...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen">
      <MapView 
        airports={airports}
        instances={instances}
        assignments={assignments}
        timeline={timeline}
      />
      <OrderPanel 
        assignments={assignments}
        instances={instances}
        timeline={timeline}
      />
      <SimControls />
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
