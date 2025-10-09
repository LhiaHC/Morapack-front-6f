import { ScrollArea } from '@radix-ui/react-scroll-area';
import * as React from 'react'
import { Outlet } from 'react-router-dom'
import FileUploadDialog from '../components/FileUploadDialog'; // ajusta la ruta si cambia
import { UploadService, parseFlightsCSV, parseAirportsCSV, type UploadResponse } from '../services/api';

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

// Sheet (simple) -------------------------------------------------
type SheetContextType = { open: boolean; setOpen: (v: boolean) => void; side: 'left' | 'right' };
const SheetContext = React.createContext<SheetContextType | null>(null);

function Sheet({ open, onOpenChange, children, side = 'left' as 'left' | 'right' }:
  { open: boolean; onOpenChange: (v: boolean) => void; children?: React.ReactNode; side?: 'left' | 'right' }) {
  return <SheetContext.Provider value={{ open, setOpen: onOpenChange, side }}>{children}</SheetContext.Provider>;
}

function SheetTrigger({ asChild = false, children }: { asChild?: boolean; children: React.ReactElement }) {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error('SheetTrigger debe estar dentro de <Sheet>');
  const child = React.cloneElement(children as React.ReactElement<any>, {
    onClick: (e: any) => { (children.props as any)?.onClick?.(e); ctx.setOpen(true); }
  });
  return asChild ? child : <button onClick={() => ctx.setOpen(true)}>{children}</button>;
}

function SheetContent({ className, children, side }: { className?: string; children?: React.ReactNode; side?: 'left' | 'right' }) {
  const ctx = React.useContext(SheetContext) as SheetContextType | null;
  if (!ctx) throw new Error('SheetContent debe estar dentro de <Sheet>');
  const realSide = side ?? ctx.side;

  React.useEffect(() => {
    const localCtx = ctx;
    function onEsc(ev: KeyboardEvent) { if (ev.key === 'Escape') localCtx.setOpen(false); }
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [ctx]);


  return (
    <>
      <div aria-hidden onClick={() => ctx.setOpen(false)} className={cn('fixed inset-0 z-[60] bg-black/40 transition-opacity', ctx.open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')} />
      <aside role="dialog" aria-modal="true" className={cn('sheet-content fixed top-0 z-[70] h-screen w-80 bg-[hsl(var(--sidebar-bg))] dark:bg-neutral-900 shadow-xl transition-transform', realSide === 'left' ? 'left-0' : 'right-0', ctx.open ? 'translate-x-0' : realSide === 'left' ? '-translate-x-full' : 'translate-x-full', className)}>
        {children}
      </aside>
    </>
  );
}

function SheetHeader({ className, children }: { className?: string; children?: React.ReactNode }) { return <div className={cn('px-4 py-3', className)}>{children}</div>; }
function SheetTitle({ className, children }: { className?: string; children?: React.ReactNode }) { return <h2 className={cn('text-lg font-semibold', className)}>{children}</h2>; }

function Separator({ className = '' }: { className?: string }) { return <div className={cn('h-px w-full bg-neutral-200 dark:bg-neutral-800', className)} />; }


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
  InfoPanelContent?: React.ComponentType
}

export default function DashboardLayout({ children, SidebarContent, InfoPanelContent }: DashboardLayoutProps) {
  const isDesktop = useIsDesktop()
  const [openLeft, setOpenLeft] = React.useState(false)   // para mobile
  const [openRight, setOpenRight] = React.useState(false)

  // Estado colapsado (solo desktop) + persistencia
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const raw = localStorage.getItem('sidebar:collapsed')
    return raw === '1'
  })
  React.useEffect(() => {
    localStorage.setItem('sidebar:collapsed', collapsed ? '1' : '0')
  }, [collapsed])

  // Acción del botón hamburguesa
  const onMenuClick = React.useCallback(() => {
    if (isDesktop) setCollapsed(c => !c)
    else setOpenLeft(o => !o)
  }, [isDesktop])


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
      {/* Floating hamburger (top-left) - visible above map, not constrained to navbar */}
      {/* Topbar */}
        <header
        data-testid="topbar"
        className="fixed inset-x-0 top-0 z-50 h-14 bg-teal-700 text-white shadow"
      >
        <div className="mx-auto grid h-full max-w-[1600px] grid-cols-[auto_1fr_auto] items-center gap-2 px-3 sm:px-4">

          {/* IZQUIERDA: Hamburguesa (abre el sidebar) */}
          <div className="flex items-center">
            <Sheet open={openLeft} onOpenChange={setOpenLeft} side="left">
              <SheetTrigger asChild>
                <Button
                  data-testid="open-sidebar"
                  variant="ghost"
                  className="text-white hover:bg-black/10"
                  aria-label="Abrir menú"
                  title="Abrir menú"
                >
                  <span className="inline-block text-xl leading-none">☰</span>
                </Button>
              </SheetTrigger>
              {/* Panel del sidebar */}
             <SheetContent className="w-[260px] sm:w-[280px] p-0 bg-[hsl(var(--sidebar-bg))]">
                <SheetHeader>
                  <SheetTitle className="text-left text-[hsl(var(--sidebar-foreground))]">
                    Menú principal
                  </SheetTitle>
                </SheetHeader>
                <Separator />
               {/* Forzar labels visibles en el overlay móvil */}
               {/* ...existing code... */}
                <ScrollArea className="sidebar-scroll h-[calc(100vh-4rem)]">
                  {SidebarContent ? <SidebarContent collapsed={false} /> : null}
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          {/* CENTRO: Acciones */}
          <div className="flex items-center justify-center gap-1 sm:gap-3 overflow-x-auto">
            <Button variant="ghost" className="text-white hover:bg-black/10 whitespace-nowrap">
              <span className="mr-2">📦</span>
              <span className="hidden xs:inline">Buscar envío</span>
              <span className="xs:hidden">Envío</span>
            </Button>
            <Button variant="ghost" className="text-white hover:bg黑/10 whitespace-nowrap">
              <span className="mr-2">✈️</span>
              <span className="hidden xs:inline">Buscar vuelo</span>
              <span className="xs:hidden">Vuelo</span>
            </Button> 
            <Button variant="ghost" className="text-white hover:bg-black/10 whitespace-nowrap">
              <span className="mr-2">🏬</span>
              <span className="hidden xs:inline">Buscar almacén</span>
              <span className="xs:hidden">Almacén</span>
            </Button>
            <Button
              variant="ghost"
              className="text-white hover:bg-black/10 whitespace-nowrap"
              onClick={()=>setUploadOpen(true)}
            >
              <span className="hidden xs:inline">Cargar data</span>
              <span className="xs:hidden">Datos iniciales</span>
            </Button>
          </div>
          <FileUploadDialog
            open={uploadOpen}
            onOpenChange={setUploadOpen}
            onConfirm={handleUploadConfirm}
            // Opcionalmente restringe formatos:
            // acceptFlights=".csv,.json"
            // acceptAirports=".csv"
            // acceptOrders=".csv"
          />

          {/* Mensajes de carga */}
          {(uploadMessages.flights || uploadMessages.airports) && (
            <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-4 min-w-[300px] z-50">
              <h3 className="font-semibold text-gray-800 mb-2">Resultado de carga</h3>
              {uploadMessages.flights && (
                <p className="text-sm text-gray-600 mb-1">{uploadMessages.flights}</p>
              )}
              {uploadMessages.airports && (
                <p className="text-sm text-gray-600 mb-1">{uploadMessages.airports}</p>
              )}
              <button
                onClick={() => setUploadMessages({})}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Cerrar
              </button>
            </div>
          )}
          {/* DERECHA: Más información */}
          <div className="flex items-center justify-end">
            <Sheet open={openRight} onOpenChange={setOpenRight} side="right">
              <SheetTrigger asChild>
                <Button
                  data-testid="open-info"
                  className="rounded-full bg-white/95 text-teal-800 hover:bg-white"
                  aria-label="Abrir información"
                  title="Más información"
                >
                  <span className="mr-2">ℹ️</span>
                  <span className="hidden sm:inline">Más información</span>
                  <span className="sm:hidden">Info</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[380px]">
                <SheetHeader>
                  <SheetTitle>Información del sistema</SheetTitle>
                </SheetHeader>
                <Separator className="my-3" />
                
              </SheetContent>
            </Sheet>
          </div>
          
        </div>
      </header>
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
