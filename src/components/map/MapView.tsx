import { useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import FlightLayer from './FlightLayer'
import type { AirportICAO, FlightInstance, AssignmentByOrder, TimelineEvent } from '../../types'

// @ts-ignore
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
// @ts-ignore
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'

interface MapViewProps {
  airports: AirportICAO[]
  instances: FlightInstance[]
  assignments: AssignmentByOrder[]
  timeline: TimelineEvent[]
  selectedOrderId?: string | null
}

export default function MapView({ airports, instances, assignments, timeline, selectedOrderId }: MapViewProps){
  const [map, setMap] = useState<L.Map | null>(null)

  useEffect(() => {
    const mapInstance = L.map('map', { zoomControl: false }).setView([-12.0464, -77.0428], 3)
    setMap(mapInstance)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapInstance)

    const DefaultIcon = L.icon({ iconUrl: markerIconUrl, shadowUrl: markerShadowUrl, iconAnchor: [12, 41] })
    // @ts-ignore
    L.Marker.prototype.options.icon = DefaultIcon

    return () => { 
      mapInstance.remove()
    }
  }, [])

  return (
    <div className="absolute inset-0 w-full h-full">
      <div id="map" className="absolute inset-0 w-full h-full" />
      {map && (
        <FlightLayer 
          map={map} 
          airports={airports}
          instances={instances}
          assignments={assignments}
          timeline={timeline}
          selectedOrderId={selectedOrderId}
        />
      )}
    </div>
  )
}
