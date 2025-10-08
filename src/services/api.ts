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

// ==== Servicios de operaciones (ejemplo) ====
export const OpsService = {
  stats: () => api.get<OpsStats>('/ops/stats'),
  flights: () => api.get<FlightDTO[]>('/ops/flights'),
  orders: () => api.get('/orders'),
}
