import * as React from 'react'
import { ScrollArea } from '@radix-ui/react-scroll-area';
import FileUploadDialog from './FileUploadDialog';

// util cls
function cn(...v:(string|false|null|undefined)[]) { return v.filter(Boolean).join(' ') }

// --- UI components ---
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

// Sheet components
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

export interface TopbarProps {
  openLeft: boolean;
  setOpenLeft: (open: boolean) => void;
  openRight: boolean;
  setOpenRight: (open: boolean) => void;
  uploadOpen: boolean;
  setUploadOpen: (open: boolean) => void;
  uploadMessages: {flights?: string, airports?: string, orders?: string};
  setUploadMessages: React.Dispatch<React.SetStateAction<{flights?: string, airports?: string, orders?: string}>>;
  handleUploadConfirm: (files: { flights?: File | null; airports?: File | null; orders?: File | null }) => Promise<void>;
  SidebarContent?: React.ComponentType<{ collapsed?: boolean }>;
}

export default function Topbar({ 
  openLeft, 
  setOpenLeft, 
  openRight, 
  setOpenRight,
  uploadOpen,
  setUploadOpen,
  uploadMessages,
  setUploadMessages,
  handleUploadConfirm,
  SidebarContent
}: TopbarProps) {


  return (
    <header
      data-testid="topbar"
      className="fixed inset-x-0 top-0 z-50 h-14 bg-gray-600 text-white shadow"
    >
      <div className="grid h-full w-full grid-cols-[auto_1fr_auto] items-center gap-2 px-3 sm:px-4 md:px-6">

        {/* IZQUIERDA: Hamburguesa (abre el sidebar) */}
        <div className="flex items-center justify-start -ml-3">
          <Sheet open={openLeft} onOpenChange={setOpenLeft} side="left">
            <SheetTrigger asChild>
              <Button
                data-testid="open-sidebar"
                variant="ghost"
                className="text-white hover:bg-gray-500"
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
              <ScrollArea className="sidebar-scroll h-[calc(100vh-4rem)]">
                {SidebarContent ? <SidebarContent collapsed={false} /> : null}
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        {/* CENTRO: Título simple */}
        <div className="flex items-center justify-center">
          <h1 className="text-lg font-semibold text-white">MoraPack</h1>
        </div>

        {/* DERECHA: Más información y Cargar data */}
        <div className="flex items-center justify-end gap-2">
          {/* Botón Cargar data (opcional, solo en desktop) */}
          <Button
            variant="ghost"
            className="text-white hover:bg-gray-500 whitespace-nowrap hidden sm:flex"
            onClick={() => setUploadOpen(true)}
          >
            <span className="mr-2">📁</span>
            <span>Cargar data</span>
          </Button>

          {/* Más información */}
          <Sheet open={openRight} onOpenChange={setOpenRight} side="right">
            <SheetTrigger asChild>
              <Button
                data-testid="open-info"
                variant="ghost"
                className="text-white hover:bg-gray-500"
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

      {/* FileUploadDialog */}
      <FileUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onConfirm={handleUploadConfirm}
      />

      {/* Mensajes de carga */}
      {(uploadMessages.flights || uploadMessages.airports || uploadMessages.orders) && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-4 min-w-[300px] z-50">
          <h3 className="font-semibold text-gray-800 mb-2">Resultado de carga</h3>
          {uploadMessages.flights && (
            <p className="text-sm text-gray-600 mb-1">{uploadMessages.flights}</p>
          )}
          {uploadMessages.airports && (
            <p className="text-sm text-gray-600 mb-1">{uploadMessages.airports}</p>
          )}
          {uploadMessages.orders && (
            <p className="text-sm text-gray-600 mb-1">{uploadMessages.orders}</p>
          )}
          <button
            onClick={() => setUploadMessages({})}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Cerrar
          </button>
        </div>
      )}
    </header>
  );
}
