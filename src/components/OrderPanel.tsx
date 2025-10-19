import { useState, useMemo } from 'react'
import type { 
  AssignmentByOrder, 
  FlightInstance, 
  TimelineEvent 
} from '../types'

interface OrderPanelProps {
  assignments: AssignmentByOrder[]
  instances: FlightInstance[]
  timeline: TimelineEvent[]
}

export default function OrderPanel({ assignments, instances, timeline }: OrderPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Crear mapa de instancias para búsqueda rápida
  const instanceMap = useMemo(() => {
    return instances.reduce((acc, instance) => {
      acc[instance.instanceId] = instance
      return acc
    }, {} as Record<string, FlightInstance>)
  }, [instances])

  // Filtrar pedidos por término de búsqueda
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return assignments
    return assignments.filter(order => 
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [assignments, searchTerm])

  // Obtener pedido seleccionado
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null
    return assignments.find(order => order.orderId === selectedOrderId)
  }, [selectedOrderId, assignments])

  // Obtener eventos de timeline para el pedido seleccionado
  const orderTimeline = useMemo(() => {
    if (!selectedOrderId) return []
    return timeline
      .filter(event => event.orderId === selectedOrderId)
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
  }, [selectedOrderId, timeline])

  return (
    <>
      {/* Botón flotante para abrir/cerrar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-20 right-4 z-[45] w-12 h-12 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-full shadow-2xl hover:from-indigo-600 hover:to-indigo-700 transition-all hover:scale-110 active:scale-95 ${
          isOpen ? 'rotate-180' : ''
        }`}
        title={isOpen ? 'Ocultar panel de pedidos' : 'Mostrar panel de pedidos'}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </button>

      {/* Panel lateral deslizante */}
      <div
        className={`fixed top-20 right-4 bottom-20 w-96 z-[44] transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'
        }`}
      >
        <div className="h-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200/50 bg-gradient-to-br from-indigo-50 to-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">Pedidos</h2>
              <div className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                {assignments.length}
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por Order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Lista de pedidos */}
          {!selectedOrder && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="text-xs text-gray-500 mb-3 font-medium">
                {filteredOrders.length} resultado(s)
              </div>
              {filteredOrders.map(order => (
                <button
                  key={order.orderId}
                  onClick={() => setSelectedOrderId(order.orderId)}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
                >
                  <div className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                    {order.orderId}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      {order.splits.length} split(s)
                    </span>
                  </div>
                </button>
              ))}
              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No se encontraron pedidos</p>
                </div>
              )}
            </div>
          )}

          {/* Detalle del pedido seleccionado */}
          {selectedOrder && (
            <div className="flex-1 overflow-y-auto p-4">
              <button
                onClick={() => setSelectedOrderId(null)}
                className="mb-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver a la lista
              </button>

              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {selectedOrder.orderId}
              </h3>

              {/* Splits */}
              <div className="space-y-4">
                {selectedOrder.splits.map((split, splitIdx) => (
                  <div key={split.consignmentId} className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                      <div className="font-semibold text-indigo-900 mb-1 flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {splitIdx + 1}
                        </div>
                        {split.consignmentId}
                      </div>
                      <div className="text-sm text-indigo-700 font-medium">
                        Cantidad: <span className="font-bold">{split.qty}</span> unidades
                      </div>
                    </div>

                    <div className="p-4 bg-white space-y-3">
                      {/* Line References */}
                      {split.lineRefs && split.lineRefs.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-2">Líneas:</div>
                          {split.lineRefs.map(lineRef => (
                            <div key={lineRef.lineId} className="text-xs ml-2 flex items-center gap-2 text-gray-600">
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              {lineRef.lineId}: {lineRef.qty} unidades
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Legs */}
                      <div>
                        <div className="text-xs font-semibold text-gray-500 mb-2">Trayectos:</div>
                        {split.legs.map(leg => {
                          const instance = instanceMap[leg.instanceId]
                          return (
                            <div key={`${leg.instanceId}-${leg.seq}`} className="mb-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                                  {leg.seq}
                                </div>
                                <div className="font-semibold text-sm text-gray-900">
                                  {leg.from} → {leg.to}
                                </div>
                              </div>
                              <div className="text-xs text-gray-600 space-y-1 ml-8">
                                <div className="flex items-center gap-2">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  {leg.instanceId}
                                </div>
                                <div>📦 Cantidad: {leg.qty} unidades</div>
                                {instance && (
                                  <>
                                    <div>🛫 Salida: {new Date(instance.depUtc).toISOString().slice(0, 19)} UTC</div>
                                    <div>🛬 Llegada: {new Date(instance.arrUtc).toISOString().slice(0, 19)} UTC</div>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Timeline (si existe) */}
              {orderTimeline.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Timeline de Eventos
                  </h4>
                  <div className="space-y-3">
                    {orderTimeline.map((event, idx) => (
                      <div key={idx} className="relative pl-6 pb-3 border-l-2 border-purple-200 last:border-transparent">
                        <div className="absolute -left-[5px] top-0 w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div className="text-xs text-gray-500 mb-1">
                          {new Date(event.ts).toISOString().slice(0, 19)} UTC
                        </div>
                        <div className="font-semibold text-sm text-gray-900">{event.type}</div>
                        {event.consignmentId && (
                          <div className="text-xs text-gray-600">Consignación: {event.consignmentId}</div>
                        )}
                        {event.instanceId && (
                          <div className="text-xs text-gray-600">Vuelo: {event.instanceId}</div>
                        )}
                        {event.from && event.to && (
                          <div className="text-xs text-gray-600">Ruta: {event.from} → {event.to}</div>
                        )}
                        {event.qty && (
                          <div className="text-xs text-gray-600">Cantidad: {event.qty}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
