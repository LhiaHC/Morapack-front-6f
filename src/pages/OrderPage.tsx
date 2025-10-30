import { useState } from 'react'
import { UploadService, PlanningService } from '../services/api'
import type { AssignmentByOrder } from '../types/simulation/assignment.types'
import type { FlightInstance } from '../types/domain/flight.types'

interface OrderStats {
  total: number
  planned: number
  unplanned: number
}

export default function OrdersPage() {
  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [planning, setPlanning] = useState<AssignmentByOrder[]>([])
  const [flightInstances, setFlightInstances] = useState<FlightInstance[]>([])
  const [stats, setStats] = useState<OrderStats>({ total: 0, planned: 0, unplanned: 0 })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Cargar planificación semanal
  const loadWeeklyPlanning = async () => {
    try {
      setLoading(true)
      const response = await PlanningService.getWeeklyPlanning()
      const assignments = response.data as AssignmentByOrder[]
      setPlanning(assignments)

      // Calcular estadísticas
      const total = assignments.length
      const planned = assignments.filter(a => a.splits && a.splits.length > 0).length
      const unplanned = total - planned
      setStats({ total, planned, unplanned })

      setUploadStatus(`✅ Planificación cargada: ${planned}/${total} pedidos planificados`)
    } catch (error: any) {
      console.error('Error loading planning:', error)
      setUploadStatus(`❌ Error: ${error.response?.data?.mensaje || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Cargar instancias de vuelos
  const loadFlightInstances = async () => {
    try {
      setLoading(true)
      const response = await PlanningService.getFlightInstances()
      const instances = response.data?.data || response.data || []
      setFlightInstances(instances)
      setUploadStatus(`✅ ${instances.length} instancias de vuelos cargadas`)
    } catch (error: any) {
      console.error('Error loading flight instances:', error)
      setUploadStatus(`❌ Error: ${error.response?.data?.mensaje || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Subir archivo de pedidos semanales
  const handleUploadOrders = async () => {
    if (!selectedFile) {
      setUploadStatus('⚠️ Por favor selecciona un archivo')
      return
    }

    try {
      setLoading(true)
      setUploadStatus('⏳ Cargando pedidos...')
      const response = await UploadService.uploadWeeklyOrders(selectedFile)
      const data = response.data
      setUploadStatus(`✅ ${data.mensaje || 'Pedidos cargados exitosamente'}`)
      setSelectedFile(null)

      // Cargar planificación automáticamente después de cargar pedidos
      setTimeout(() => loadWeeklyPlanning(), 1000)
    } catch (error: any) {
      console.error('Error uploading orders:', error)
      setUploadStatus(`❌ Error: ${error.response?.data?.mensaje || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Pedidos Semanales</h2>
        <p className="text-sm text-gray-600 mt-1">
          Carga pedidos, visualiza la planificación y consulta instancias de vuelos
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">1. Cargar Pedidos Semanales</h3>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo de pedidos (.txt)
            </label>
            <input
              type="file"
              accept=".txt"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <button
            onClick={handleUploadOrders}
            disabled={loading || !selectedFile}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Cargando...' : 'Cargar Pedidos'}
          </button>
        </div>

        {uploadStatus && (
          <div className={`p-3 rounded ${
            uploadStatus.startsWith('✅') ? 'bg-green-50 text-green-700' :
            uploadStatus.startsWith('❌') ? 'bg-red-50 text-red-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {uploadStatus}
          </div>
        )}
      </div>

      {/* Actions Section */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">2. Consultar Datos</h3>

        <div className="flex gap-4">
          <button
            onClick={loadWeeklyPlanning}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
          >
            {loading ? 'Cargando...' : 'Ver Planificación Semanal'}
          </button>

          <button
            onClick={loadFlightInstances}
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300"
          >
            {loading ? 'Cargando...' : 'Ver Instancias de Vuelos'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Pedidos</p>
            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Planificados</p>
            <p className="text-3xl font-bold text-green-600">{stats.planned}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">No Planificados</p>
            <p className="text-3xl font-bold text-red-600">{stats.unplanned}</p>
          </div>
        </div>
      )}

      {/* Planning Table */}
      {planning.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-700">Planificación Semanal</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Splits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalles</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {planning.map((order) => {
                  const totalQty = order.splits?.reduce((sum, split) => sum + split.qty, 0) || 0
                  const hasSplits = order.splits && order.splits.length > 0

                  return (
                    <tr key={order.orderId} className={!hasSplits ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {order.orderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {order.splits?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {totalQty} paquetes
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasSplits ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            PLANIFICADO
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            NO FACTIBLE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {order.splits?.map((split, idx) => (
                          <div key={idx} className="mb-1">
                            <span className="font-medium">{split.consignmentId}:</span>{' '}
                            {split.legs.length} leg(s), {split.qty} paquetes
                          </div>
                        ))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Flight Instances Table */}
      {flightInstances.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-700">Instancias de Vuelos ({flightInstances.length})</h3>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instance ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salida (UTC)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Llegada (UTC)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacidad</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {flightInstances.map((flight, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                      {flight.instanceId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {flight.origin} → {flight.dest}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(flight.depUtc).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(flight.arrUtc).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {flight.capacity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {planning.length === 0 && flightInstances.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-600">
            No hay datos cargados. Sube un archivo de pedidos y consulta la planificación.
          </p>
        </div>
      )}
    </div>
  )
}
