import axios from 'axios'
import type { FlightDTO, OpsStats } from '../types'

/* ==============================================
   🔧 CONFIGURACIÓN BASE DE AXIOS
   ============================================== */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 180000,
})

// Interceptor opcional (headers comunes)
api.interceptors.request.use((cfg) => {
  cfg.headers.set('X-Client', 'MoraPack-UI')
  return cfg
})

export default api

/* ==============================================
   📦 TIPOS DE DATOS
   ============================================== */
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

/* ==============================================
   🧩 PARSERS CSV → JSON (solo si los necesitas)
   ============================================== */
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

/* ==============================================
   📊 SERVICIO DE OPERACIONES / ESTADÍSTICAS
   ============================================== */
export const OpsService = {
  /** Obtiene indicadores operativos generales */
  stats: () => api.get<OpsStats>('/ops/stats'),

  /** Obtiene lista de vuelos activos o simulados */
  flights: () => api.get<FlightDTO[]>('/vuelos'),

  /** Obtiene lista de pedidos (cuando se implemente en backend) */
  orders: () => api.get('/orders'),
}

/* ==============================================
   🚀 SERVICIOS DE CARGA Y CONSULTA DE DATOS REALES
   ============================================== */
export const UploadService = {
  uploadFlights: (file: File) => {
    const formData = new FormData();
    formData.append("archivo", file); // 🔑 nombre exacto del parámetro en el backend
    return api.post("/vuelos/archivo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadAirports: (file: File) => {
    const formData = new FormData();
    formData.append("archivo", file);
    return api.post("/aeropuertos/archivo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadOrders: (file: File) => {
    const formData = new FormData();
    formData.append("archivo", file);
    return api.post("/pedidos/cargar_archivo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // 👇 NUEVO: obtener todos los aeropuertos desde backend
  getAllAirports: () => {
    return api.get("/aeropuertos/todos");
  },
};
