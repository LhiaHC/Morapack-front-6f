import { useEffect, useState } from 'react'
import { UploadService } from '../services/api'
import type { AirportICAO } from '../types'

export default function AirportsPage() {
  const [airports, setAirports] = useState<AirportICAO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        setLoading(true)
        const response = await UploadService.getAllAirports()
        console.log('Aeropuertos obtenidos:', response.data)

        if (response.data && Array.isArray(response.data)) {
          setAirports(response.data)
        } else {
          setError('Formato de respuesta inesperado')
        }
      } catch (err) {
        console.error('Error cargando aeropuertos:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchAirports()
  }, [])

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-4">Gestión de aeropuertos</h1>
        <div className="text-center py-8">Cargando aeropuertos...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-4">Gestión de aeropuertos</h1>
        <div className="text-red-600 bg-red-50 p-4 rounded-md">
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Gestión de aeropuertos</h1>
      <p className="text-sm text-muted-foreground">
        Total de aeropuertos cargados: {airports.length}
      </p>

      <section className="bg-white p-4 rounded-md border">
        <h2 className="font-medium mb-4">Lista de Aeropuertos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left">ICAO</th>
                <th className="px-4 py-2 text-left">Nombre</th>
                <th className="px-4 py-2 text-left">Ciudad</th>
                <th className="px-4 py-2 text-left">Coordenadas</th>
                <th className="px-4 py-2 text-left">Capacidad</th>
                <th className="px-4 py-2 text-left">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {airports.map((airport) => (
                <tr key={airport.icao} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono font-semibold">{airport.icao}</td>
                  <td className="px-4 py-2">{airport.name}</td>
                  <td className="px-4 py-2">{airport.city}</td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {airport.lat.toFixed(4)}, {airport.lon.toFixed(4)}
                  </td>
                  <td className="px-4 py-2">{airport.warehouseCapacity}</td>
                  <td className="px-4 py-2">
                    {airport.infiniteSource ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        ⭐ HUB
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Regular
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}