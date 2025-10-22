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
  const [uploadMessages, setUploadMessages] = React.useState<{ flights?: string; airports?: string }>({})

  // ✅ Mover handleUploadConfirm aquí dentro
  const handleUploadConfirm = async (files: { flights?: File | null; airports?: File | null; orders?: File | null }) => {
    setUploadMessages({}) // Limpiar mensajes anteriores

    try {
      // === Vuelos ===
      if (files.flights) {
        try {
          const response = await UploadService.uploadFlights(files.flights) // Enviamos el archivo real
          console.log('Respuesta vuelos:', response.data)
          setUploadMessages(prev => ({
            ...prev,
            flights: response.data.success
              ? `✅ Vuelos cargados correctamente (${response.data.count} registros)`
              : `❌ Error al cargar vuelos: ${response.data.message}`
          }))
        } catch (error) {
          console.error('Error al subir vuelos:', error)
          setUploadMessages(prev => ({
            ...prev,
            flights: '❌ Error de conexión al cargar vuelos'
          }))
        }
      }

      // === Aeropuertos ===
      if (files.airports) {
        try {
          const response = await UploadService.uploadAirports(files.airports)
          console.log('Respuesta aeropuertos:', response.data)
          setUploadMessages(prev => ({
            ...prev,
            airports: response.data.success
  ? `✅ Aeropuertos cargados correctamente (${response.data.data?.totalAeropuertosCargados ?? 0} registros)`
              : `❌ Error al cargar aeropuertos: ${response.data.message}`
          }))
        } catch (error) {
          console.error('Error al subir aeropuertos:', error)
          setUploadMessages(prev => ({
            ...prev,
            airports: '❌ Error de conexión al cargar aeropuertos'
          }))
        }
      }

      if (files.orders) {
        console.log('Archivo de pedidos seleccionado:', files.orders.name)
      }

    } catch (error) {
      console.error('Error procesando archivos:', error)
      setUploadMessages({
        flights: '❌ Error al procesar el archivo de vuelos',
        airports: '❌ Error al procesar el archivo de aeropuertos'
      })
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
        uploadMessages={uploadMessages}
        setUploadMessages={setUploadMessages}
        handleUploadConfirm={handleUploadConfirm}
        SidebarContent={SidebarContent}
      />

      {/* Main content */}
      <main className="absolute top-14 left-0 right-0 bottom-0 overflow-hidden">
        <div className="w-full h-full">{children ? children : <Outlet />}</div>
      </main>
    </div>
  )
}
