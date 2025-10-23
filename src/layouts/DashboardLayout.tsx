import * as React from 'react'
import { Outlet } from 'react-router-dom'
import Topbar from '../components/Topbar'
import { UploadService } from '../services/api'

// util cls
function cn(...v: (string | false | null | undefined)[]) {
  return v.filter(Boolean).join(' ')
}

// --- UI mínimos (Button, Sheet, Separator, ScrollArea) - implementaciones pequeñas y autocontenidas
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost';
  size?: 'md' | 'lg';
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
    const variants = {
      default: 'bg-gray-600 text-white hover:bg-gray-500 focus:ring-gray-400',
      ghost: 'bg-transparent text-inherit hover:bg-black/10 dark:hover:bg-white/10 focus:ring-gray-400',
    } as const
    const sizes = { md: 'h-9 px-3 text-sm', lg: 'h-11 px-6 text-base' } as const
    return <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
  }
)
Button.displayName = 'Button'

// === DashboardLayout Props ===
export type DashboardLayoutProps = {
  children?: React.ReactNode
  SidebarContent?: React.ComponentType<{ collapsed?: boolean }>
}

export default function DashboardLayout({ children, SidebarContent }: DashboardLayoutProps) {
  const [openLeft, setOpenLeft] = React.useState(false)
  const [openRight, setOpenRight] = React.useState(false)

  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [dataAlreadyLoaded, setDataAlreadyLoaded] = React.useState(false)
  const [checkingDataStatus, setCheckingDataStatus] = React.useState(true)
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<{
    current: string;
    completed: string[];
    total: number;
  }>({ current: '', completed: [], total: 0 })

  // Verificar si ya hay datos cargados al montar
  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await UploadService.checkDataStatus()
        console.log('📊 Estado de datos en backend:', status)
        setDataAlreadyLoaded(status.hasData)

        if (status.hasData) {
          console.log(`ℹ️ Ya hay datos cargados: ${status.airportsCount} aeropuertos, ${status.flightsCount} vuelos`)
        }
      } catch (error) {
        console.error('Error verificando estado de datos:', error)
      } finally {
        setCheckingDataStatus(false)
      }
    }

    checkStatus()
  }, [])

  // ✅ Mover handleUploadConfirm aquí dentro
  const handleUploadConfirm = async (files: { flights?: File | null; airports?: File | null; orders?: File | null }) => {
    setUploading(true) // Activar overlay de carga

    // Calcular total de archivos a cargar
    const filesToUpload = [files.flights, files.airports, files.orders].filter(f => f !== null && f !== undefined)
    const totalFiles = filesToUpload.length

    setUploadProgress({
      current: '',
      completed: [],
      total: totalFiles
    })

    try {
      // === Vuelos ===
      if (files.flights) {
        setUploadProgress(prev => ({ ...prev, current: 'Cargando vuelos...' }))
        try {
          const response = await UploadService.uploadFlights(files.flights)
          console.log('✅ Vuelos:', response.data)

          setUploadProgress(prev => ({
            ...prev,
            completed: [...prev.completed, 'vuelos'],
            current: ''
          }))
        } catch (error) {
          console.error('❌ Error al subir vuelos:', error)
          setUploadProgress(prev => ({
            ...prev,
            completed: [...prev.completed, 'vuelos'],
            current: ''
          }))
        }
      }

      // === Aeropuertos ===
      if (files.airports) {
        setUploadProgress(prev => ({ ...prev, current: 'Cargando aeropuertos...' }))
        try {
          const response = await UploadService.uploadAirports(files.airports)
          console.log('✅ Aeropuertos:', response.data)

          setUploadProgress(prev => ({
            ...prev,
            completed: [...prev.completed, 'aeropuertos'],
            current: ''
          }))
        } catch (error) {
          console.error('❌ Error al subir aeropuertos:', error)
          setUploadProgress(prev => ({
            ...prev,
            completed: [...prev.completed, 'aeropuertos'],
            current: ''
          }))
        }
      }

      // === Pedidos ===
      if (files.orders) {
        setUploadProgress(prev => ({ ...prev, current: 'Cargando pedidos...' }))
        try {
          const response = await UploadService.uploadOrders(files.orders)
          console.log('✅ Pedidos:', response.data)

          setUploadProgress(prev => ({
            ...prev,
            completed: [...prev.completed, 'pedidos'],
            current: ''
          }))
        } catch (error) {
          console.error('❌ Error al subir pedidos:', error)
          setUploadProgress(prev => ({
            ...prev,
            completed: [...prev.completed, 'pedidos'],
            current: ''
          }))
        }
      }

    } catch (error) {
      console.error('❌ Error procesando archivos:', error)
    } finally {
      // Después de cargar archivos, marcar que ya hay datos
      if (files.airports || files.flights || files.orders) {
        setDataAlreadyLoaded(true)
        console.log('✅ Datos marcados como cargados, botón deshabilitado')
      }

      // Esperar 800ms antes de ocultar el overlay y disparar el refresco final
      setTimeout(() => {
        setUploading(false)
        // Disparar evento para que el mapa se refresque DESPUÉS de ocultar el overlay
        window.dispatchEvent(new CustomEvent('upload-complete'))
        console.log('🎉 Carga completa, mapa se refrescará')
      }, 800)
    }
  }

  // === Render principal ===
  return (
    <div className="fixed inset-0 bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Topbar */}
      <Topbar
        openLeft={openLeft}
        setOpenLeft={setOpenLeft}
        openRight={openRight}
        setOpenRight={setOpenRight}
        uploadOpen={uploadOpen}
        setUploadOpen={setUploadOpen}
        handleUploadConfirm={handleUploadConfirm}
        SidebarContent={SidebarContent}
        dataAlreadyLoaded={dataAlreadyLoaded}
      />

      {/* Main content */}
      <main className="absolute top-14 left-0 right-0 bottom-0 overflow-hidden">
        <div className="w-full h-full">{children ? children : <Outlet />}</div>
      </main>

      {/* Overlay de carga de archivos */}
      {uploading && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <span className="text-3xl animate-bounce">📦</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Cargando archivos al backend
              </h3>
              <p className="text-sm text-gray-600">
                Por favor espere mientras se procesan los datos...
              </p>
            </div>

            {/* Progreso */}
            <div className="space-y-4">
              {/* Barra de progreso */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(uploadProgress.completed.length / uploadProgress.total) * 100}%`
                  }}
                />
              </div>

              {/* Texto de progreso */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  {uploadProgress.current || 'Procesando...'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {uploadProgress.completed.length} de {uploadProgress.total} archivos completados
                </p>
              </div>

              {/* Lista de completados */}
              {uploadProgress.completed.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadProgress.completed.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-lg"
                    >
                      <span className="text-green-600">✓</span>
                      <span className="capitalize">{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Spinner */}
            <div className="mt-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
