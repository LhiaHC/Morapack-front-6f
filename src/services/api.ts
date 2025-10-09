import axios from 'axios'
import type { FlightDTO, OpsStats } from '../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 15000,
})

// Interceptor de ejemplo (headers comunes)
api.interceptors.request.use((cfg) => {
  cfg.headers.set('X-Client', 'MoraPack-UI')
  return cfg
})

export default api

// ==== Tipos para los datos ====
export interface FlightData {
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  duration: string
}

export interface AirportData {
  id: string
  code: string
  name: string
  country: string
  abbreviation: string
  utcOffset: number
  elevation: number
  latitude: string
  longitude: string
  continent: string
}

export interface UploadResponse {
  success: boolean
  message: string
  count?: number
}

// ==== Funciones de parsing ====
export const parseFlightsCSV = (csvContent: string): FlightData[] => {
  const lines = csvContent.trim().split('\n')
  return lines.map(line => {
    const [origin, destination, departureTime, arrivalTime, duration] = line.split(',')
    return {
      origin: origin.trim(),
      destination: destination.trim(),
      departureTime: departureTime.trim(),
      arrivalTime: arrivalTime.trim(),
      duration: duration.trim()
    }
  })
}

export const parseAirportsCSV = (csvContent: string): AirportData[] => {
  const lines = csvContent.trim().split('\n')
  return lines.map(line => {
    const [id, code, name, country, abbreviation, utcOffset, elevation, latitude, longitude, continent] = line.split(',')
    return {
      id: id.trim(),
      code: code.trim(),
      name: name.trim(),
      country: country.trim(),
      abbreviation: abbreviation.trim(),
      utcOffset: parseInt(utcOffset.trim()),
      elevation: parseInt(elevation.trim()),
      latitude: latitude.trim(),
      longitude: longitude.trim(),
      continent: continent.trim()
    }
  })
}

// ==== Servicios de operaciones (ejemplo) ====
export const OpsService = {
  stats: () => api.get<OpsStats>('/ops/stats'),
  flights: () => api.get<FlightDTO[]>('/ops/flights'),
  orders: () => api.get('/orders'),
}

// ==== Servicios de carga de datos ====
export const UploadService = {
  uploadFlights: (flights: FlightData[]) =>
    api.post<UploadResponse>('/upload/flights', { flights }),

  uploadAirports: (airports: AirportData[]) =>
    api.post<UploadResponse>('/upload/airports', { airports }),
}
