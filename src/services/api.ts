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
    return api.post("/vuelos/archivo", formData);
  },

  uploadAirports: (file: File) => {
    const formData = new FormData();
    formData.append("archivo", file);
    return api.post("/aeropuertos/archivo", formData);
  },

  uploadOrders: (file: File) => {
    const formData = new FormData();
    formData.append("archivo", file);
    return api.post("/pedidos/cargar_archivo", formData);
  },

  // 👇 NUEVO: obtener todos los aeropuertos desde backend
  getAllAirports: () => {
    return api.get("/aeropuertos/todos");
  },

  // 👇 NUEVO: obtener instancias de vuelos desde backend
  getFlightInstances: (page: number = 0, size: number = 10000) => {
    return api.get(`/vuelos/instances2?page=${page}&size=${size}`);
  },

  // 👇 NUEVO: obtener asignaciones (planificación semanal) desde backend
  getAssignments: () => {
    return api.get("/asignaciones");
  },

  // 👇 NUEVO: obtener timeline desde backend (opcional)
  getTimeline: () => {
    return api.get("/timeline");
  },

  // 👇 Verificar si hay datos cargados en el backend
  checkDataStatus: async () => {
    try {
      const [airportsRes, flightsRes] = await Promise.all([
        api.get("/aeropuertos/todos"),
        api.get("/vuelos")
      ]);

      const hasAirports = airportsRes.data && Array.isArray(airportsRes.data) && airportsRes.data.length > 0;
      const hasFlights = flightsRes.data?.data?.vuelos && Array.isArray(flightsRes.data.data.vuelos) && flightsRes.data.data.vuelos.length > 0;

      return {
        hasData: hasAirports || hasFlights,
        hasAirports,
        hasFlights,
        airportsCount: hasAirports ? airportsRes.data.length : 0,
        flightsCount: hasFlights ? flightsRes.data.data.vuelos.length : 0
      };
    } catch (error) {
      console.error('Error checking data status:', error);
      return {
        hasData: false,
        hasAirports: false,
        hasFlights: false,
        airportsCount: 0,
        flightsCount: 0
      };
    }
  },

  // 👇 NUEVO: Cargar pedidos semanales
  uploadWeeklyOrders: (file: File) => {
    const formData = new FormData();
    formData.append("archivo", file);
    return api.post("/semanal/cargar", formData);
  },

  // 👇 NUEVO: Cargar cancelaciones
  uploadCancellations: (file: File) => {
    const formData = new FormData();
    formData.append("archivo", file);
    return api.post("/planificacion/cancelaciones", formData);
  },
};

/* ==============================================
   🗓️ SERVICIOS DE PLANIFICACIÓN SEMANAL
   ============================================== */
export const PlanningService = {
  /**
   * Obtiene las instancias de vuelos para la semana (7 días)
   * @returns Lista de instancias de vuelos con formato Flight_instances_DTO
   */
  getFlightInstances: () => {
    return api.get("/vuelos/instances");
  },

  /**
   * Obtiene la planificación semanal de pedidos
   * @returns Lista de asignaciones por pedido (assignments_split_icao)
   */
  getWeeklyPlanning: () => {
    return api.get("/semanal/planificacion");
  },

  /**
   * Obtiene la planificación de pedidos con el nuevo formato
   * @returns Lista de OrderPlanDTO con orderId, splits y legs
   */
  getOrderPlanning: () => {
    return api.get("/planificacion/pedidos");
  },
};
