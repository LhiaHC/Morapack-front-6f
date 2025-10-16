import * as React from 'react'
import { Outlet } from 'react-router-dom'
import Topbar from '../components/Topbar'
import { UploadService, parseFlightsCSV, parseAirportsCSV } from '../services/api';

// util cls
function cn(...v:(string|false|null|undefined)[]) { return v.filter(Boolean).join(' ') }

// --- UI mínimos (Button, Sheet, Separator, ScrollArea) - implementaciones pequeñas y autocontenidas

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost';
  size?: 'md' | 'lg';
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'default', size = 'md', ...props }, ref) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    default: 'bg-gray-600 text-white hover:bg-gray-500 focus:ring-gray-400',
    ghost: 'bg-transparent text-inherit hover:bg-black/10 dark:hover:bg-white/10 focus:ring-gray-400',
  } as const;
  const sizes = { md: 'h-9 px-3 text-sm', lg: 'h-11 px-6 text-base' } as const;
  return <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
});
Button.displayName = 'Button';




// === Hook: detectar desktop (≥ lg) ===
function useIsDesktop(query = '(min-width: 1024px)') {
  const [is, setIs] = React.useState<boolean>(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false))
  React.useEffect(() => {
    const m = window.matchMedia(query)
    const onChange = () => setIs(m.matches)
    if (typeof m.addEventListener === 'function') m.addEventListener('change', onChange)
    else if (typeof m.addListener === 'function') m.addListener(onChange)
    onChange()
    return () => {
      if (typeof m.removeEventListener === 'function') m.removeEventListener('change', onChange)
      else if (typeof m.removeListener === 'function') m.removeListener(onChange)
    }
  }, [query])
  return is
}

export type DashboardLayoutProps = {
  children?: React.ReactNode
  SidebarContent?: React.ComponentType<{ collapsed?: boolean }>
}

export default function DashboardLayout({ children, SidebarContent }: DashboardLayoutProps) {
  const isDesktop = useIsDesktop()
  const [openLeft, setOpenLeft] = React.useState(false)   // para mobile
  const [openRight, setOpenRight] = React.useState(false)

  // Estado colapsado (solo desktop) + persistencia
  const [collapsed] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const raw = localStorage.getItem('sidebar:collapsed')
    return raw === '1'
  })


  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploadMessages, setUploadMessages] = React.useState<{flights?: string, airports?: string}>({});

  const handleUploadConfirm = async (files: { flights?: File | null; airports?: File | null; orders?: File | null }) => {
    setUploadMessages({}); // Limpiar mensajes anteriores

    try {
      // Procesar vuelos si se seleccionó el archivo
      if (files.flights) {
        const flightsContent = await files.flights.text();
        const flightsData = parseFlightsCSV(flightsContent);
        console.log(flightsData);
        try {
          const response = await UploadService.uploadFlights(flightsData);
          setUploadMessages(prev => ({
            ...prev,
            flights: response.data.success
              ? `✅ Vuelos cargados correctamente (${response.data.count} registros)`
              : `❌ Error al cargar vuelos: ${response.data.message}`
          }));
        } catch (error) {
          setUploadMessages(prev => ({
            ...prev,
            flights: '❌ Error de conexión al cargar vuelos'
          }));
        }
      }

      // Procesar aeropuertos si se seleccionó el archivo
      if (files.airports) {
        const airportsContent = await files.airports.text();
        const airportsData = parseAirportsCSV(airportsContent);
        console.log(airportsData);
        try {
          const response = await UploadService.uploadAirports(airportsData);
          setUploadMessages(prev => ({
            ...prev,
            airports: response.data.success
              ? `✅ Aeropuertos cargados correctamente (${response.data.count} registros)`
              : `❌ Error al cargar aeropuertos: ${response.data.message}`
          }));
        } catch (error) {
          setUploadMessages(prev => ({
            ...prev,
            airports: '❌ Error de conexión al cargar aeropuertos'
          }));
        }
      }

      // Si se seleccionó pedidos, solo log por ahora
      if (files.orders) {
        console.log('Archivo de pedidos seleccionado:', files.orders.name);
      }

    } catch (error) {
      console.error('Error procesando archivos:', error);
      setUploadMessages({
        flights: '❌ Error al procesar el archivo de vuelos',
        airports: '❌ Error al procesar el archivo de aeropuertos'
      });
    }
  };
  return (
    <div className="fixed inset-0 bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Topbar component */}
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
      {/* Main empujado por el sidebar persistente */}
      <main
        className={cn(
          'absolute inset-0 pt-14 transition-[padding-left] duration-300 ease-in-out',
          isDesktop && (collapsed ? 'pl-[72px]' : 'pl-[260px]')
        )}
      >
        {children ? children : <Outlet />}
      </main>

      {/* Botón flotante Simulación */}
      <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center">
        <Button data-testid="simulation-button" size="lg" className="rounded-full shadow-lg">
          ⚙️ Simulación
        </Button>
      </div>
    </div>
  )
}
