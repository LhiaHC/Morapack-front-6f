import { useEffect, useState } from 'react'
import { Button } from './ui/button'

import type { OpsStats } from '../types'
import api from '../services/api'

export default function Rightbar({ currentRoute }: { currentRoute: string }) {
  const [stats, setStats] = useState<OpsStats>({ flights: 0, orders: 0, etaDelays: 0 })

  useEffect(() => {
    api.get('/ops/stats').then(r => setStats(r.data)).catch(() => {})
  }, [currentRoute])

  return (
    <div className="p-3 space-y-3">
      <h3 className="font-semibold">Indicadores</h3>

      <div className="grid grid-cols-1 gap-2">
        <div className="p-3 rounded-xl border">Vuelos activos: <b>{stats.flights}</b></div>
        <div className="p-3 rounded-xl border">Pedidos en tránsito: <b>{stats.orders}</b></div>
        <div className="p-3 rounded-xl border">ETAs con retraso: <b>{stats.etaDelays}</b></div>
      </div>

      <div className="pt-2">
        <Button className="w-full" variant="outline">Exportar reporte</Button>
      </div>
    </div>
  )
}
