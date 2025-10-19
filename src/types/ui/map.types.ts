import type { FlightId } from '../utils/time.types'

/* ========== Tipos de UI/Mapa ========== */

/**
 * Coordenadas geográficas
 */
export type LatLng = { 
  lat: number
  lng: number 
}

/**
 * Estado de marcador de vuelo en el mapa
 */
export type FlightMarkerState = {
  id: FlightId
  position: LatLng
  active: boolean           // en ruta (true) o en origen/destino (false)
  /** 0..1 porcentaje de avance del trayecto (sólo para UI) */
  progress?: number
  /** 0..1 nivel de ocupación del vuelo (loaded/capacity) */
  loadFactor?: number
}

/**
 * Polilínea de ruta entre aeropuertos
 */
export type RoutePolyline = {
  id: string                // único por (id de vuelo + día) si lo necesitas
  from: LatLng
  to: LatLng
  /** Color o estilo sugerido (UI); opcional */
  color?: string
}
