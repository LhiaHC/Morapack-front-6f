export type OrderStatus = 'pending' | 'in_flight' | 'delivered'

export type Order = {
  id: string
  customer: string
  products: number
  origin: string
  destination: string
  status: OrderStatus
  createdAt?: string
  eta?: string
}

export type FlightDTO = {
  id: string
  from: string
  to: string
  lat: number
  lng: number
  etd: string // fecha/hora programada de salida (ISO)
  eta: string // fecha/hora programada de llegada (ISO)
}

/** Indicadores de Rightbar */
export type OpsStats = {
  flights: number
  orders: number
  etaDelays: number
}
