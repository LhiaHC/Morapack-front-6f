// DashboardLayout (Tailwind, sin dependencias de shadcn/ui)
// Fix: Se eliminaron importaciones a '../ui/*' que no existen en tu árbol.
// El archivo define componentes mínimos (Button, Sheet, Separator, ScrollArea)
// para que compile en cualquier estructura sin alias ni paths especiales.
// Ubicación sugerida: src/components/layout/DashboardLayout.tsx

import * as React from 'react';
import { Outlet } from 'react-router-dom';

// NOTE: Reemplazo de `react-icons` por pequeños componentes internos con emoji
// para evitar añadir dependencias sólo por iconos y facilitar que el archivo
// compile sin instalaciones adicionales.
function MenuIcon({ className = '' }: { className?: string }) {
  return (
    <span role="img" aria-label="menu" className={className}>
      ☰
    </span>
  );
}
function BoxIcon({ className = '' }: { className?: string }) {
  return (
    <span role="img" aria-label="box" className={className}>
      📦
    </span>
  );
}
function PlaneIcon({ className = '' }: { className?: string }) {
  return (
    <span role="img" aria-label="plane" className={className}>
      ✈️
    </span>
  );
}
function WarehouseIcon({ className = '' }: { className?: string }) {
  return (
    <span role="img" aria-label="warehouse" className={className}>
      🏬
    </span>
  );
}
function InfoIcon({ className = '' }: { className?: string }) {
  return (
    <span role="img" aria-label="info" className={className}>
      ℹ️
    </span>
  );
}

// =============================================================
// Utilidad local cn()
// =============================================================
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

// =============================================================
// Componentes mínimos de UI (Button, Sheet, Separator, ScrollArea)
// =============================================================

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost';
  size?: 'md' | 'lg';
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    const variants = {
      default: 'bg-teal-700 text-white hover:bg-teal-600 focus:ring-teal-400',
      ghost: 'bg-transparent text-inherit hover:bg-black/10 dark:hover:bg-white/10 focus:ring-teal-400',
    } as const;
    const sizes = {
      md: 'h-9 px-3 text-sm',
      lg: 'h-11 px-6 text-base',
    } as const;
    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
    );
  }
);
Button.displayName = 'Button';

// Sheet API compatible (muy simplificada)
// Uso: <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild>...</SheetTrigger><SheetContent side="left">...</SheetContent></Sheet>

type SheetContextType = {
  open: boolean;
  setOpen: (v: boolean) => void;
  side: 'left' | 'right';
};

const SheetContext = React.createContext<SheetContextType | null>(null);

function Sheet({
  open,
  onOpenChange,
  children,
  side = 'left' as 'left' | 'right',
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children?: React.ReactNode;
  side?: 'left' | 'right';
}) {
  return (
    <SheetContext.Provider value={{ open, setOpen: onOpenChange, side }}>{children}</SheetContext.Provider>
  );
}

function SheetTrigger({ asChild = false, children }: { asChild?: boolean; children: React.ReactElement }) {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error('SheetTrigger debe estar dentro de <Sheet>');
  const child = React.cloneElement(children as React.ReactElement<any>, {
    onClick: (e: any) => {
      // preserve any existing handler
      (children.props as any)?.onClick?.(e);
      (ctx as SheetContextType).setOpen(true);
    },
  });
  return asChild ? child : <button onClick={() => (ctx as SheetContextType).setOpen(true)}>{children}</button>;
}

function SheetContent({ className, children, side }: { className?: string; children?: React.ReactNode; side?: 'left' | 'right' }) {
  const ctx = React.useContext(SheetContext) as SheetContextType | null;
  if (!ctx) throw new Error('SheetContent debe estar dentro de <Sheet>');
  const realSide = side ?? ctx.side;

  React.useEffect(() => {
    const localCtx = ctx;
    function onEsc(ev: KeyboardEvent) {
      if (ev.key === 'Escape') localCtx.setOpen(false);
    }
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [ctx]);

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden
        onClick={() => ctx.setOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity',
          ctx.open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed top-0 z-50 h-screen w-80 bg-white dark:bg-neutral-900 shadow-xl transition-transform',
          realSide === 'left' ? 'left-0' : 'right-0',
          ctx.open
            ? 'translate-x-0'
            : realSide === 'left'
            ? '-translate-x-full'
            : 'translate-x-full',
          className
        )}
      >
        {children}
      </aside>
    </>
  );
}

function SheetHeader({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn('px-4 py-3', className)}>{children}</div>;
}

function SheetTitle({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <h2 className={cn('text-lg font-semibold', className)}>{children}</h2>;
}

function Separator({ className = '' }: { className?: string }) {
  return <div className={cn('h-px w-full bg-neutral-200 dark:bg-neutral-800', className)} />;
}

function ScrollArea({ className = '', children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn('overflow-y-auto', className)}>{children}</div>;
}

// =============================================================
// Layout
// =============================================================

export type DashboardLayoutProps = {
  children?: React.ReactNode;
  SidebarContent?: React.ComponentType;
  InfoPanelContent?: React.ComponentType;
};

export default function DashboardLayout({ children, SidebarContent, InfoPanelContent }: DashboardLayoutProps) {
  const [openLeft, setOpenLeft] = React.useState(false);
  const [openRight, setOpenRight] = React.useState(false);

  return (
    <div className="fixed inset-0 bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Topbar */}
      <header data-testid="topbar" className="fixed inset-x-0 top-0 z-50 h-14 bg-teal-700 text-white shadow">
        <div className="mx-auto flex h-full max-w-[1600px] items-center gap-3 px-3 sm:px-4">
          {/* Sidebar trigger */}
          <Sheet open={openLeft} onOpenChange={setOpenLeft} side="left">
            <SheetTrigger asChild>
              <Button data-testid="open-sidebar" variant="ghost" className="text-white hover:bg-teal-600">
                <MenuIcon className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-72 p-0">
              <SheetHeader>
                <SheetTitle className="text-left">Menú principal</SheetTitle>
              </SheetHeader>
              <Separator />
              <ScrollArea className="h-[calc(100vh-4rem)] px-2 py-2">
                {SidebarContent ? (
                  <SidebarContent />
                ) : (
                  <nav className="space-y-1 px-1">
                    {['Panel', 'Envíos', 'Vuelos', 'Almacenes', 'Simulación'].map((item) => (
                      <Button key={item} variant="ghost" className="w-full justify-start">
                        {item}
                      </Button>
                    ))}
                  </nav>
                )}
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Acciones centradas */}
          <div className="mx-auto flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" className="text-white hover:bg-teal-600">
              <BoxIcon className="mr-2" /> Buscar envío
            </Button>
            <Button variant="ghost" className="text-white hover:bg-teal-600">
              <PlaneIcon className="mr-2" /> Buscar vuelo
            </Button>
            <Button variant="ghost" className="text-white hover:bg-teal-600">
              <WarehouseIcon className="mr-2" /> Buscar almacén
            </Button>
          </div>

          {/* Botón Más información (abre panel derecho) */}
          <Sheet open={openRight} onOpenChange={setOpenRight} side="right">
            <SheetTrigger asChild>
              <Button data-testid="open-info" className="rounded-full bg-white/95 text-teal-800 hover:bg-white">
                <InfoIcon className="mr-2" /> Más información
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[380px]">
              <SheetHeader>
                <SheetTitle>Información del sistema</SheetTitle>
              </SheetHeader>
              <Separator className="my-3" />
              <ScrollArea className="h-[calc(100vh-8rem)] pr-2">
                {InfoPanelContent ? (
                  <InfoPanelContent />
                ) : (
                  <div className="space-y-3 text-sm">
                    <p>Coloca aquí KPIs, ayuda contextual, enlaces a documentación y últimos eventos.</p>
                    <ul className="list-disc pl-5">
                      <li>Estado de servicios</li>
                      <li>Últimas simulaciones</li>
                      <li>Documentación de la API</li>
                      <li>Soporte</li>
                    </ul>
                  </div>
                )}
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Contenido - Fullscreen */}
      <main className="absolute inset-0 pt-14">
        {children ? (
          children
        ) : (
          <Outlet />
        )}
      </main>

      {/* Botón flotante inferior (Simulación) */}
      <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center">
        <Button data-testid="simulation-button" size="lg" className="rounded-full shadow-lg">
          ⚙️ Simulación
        </Button>
      </div>
    </div>
  );
}

/*
=====================================================
Pruebas (Vitest + React Testing Library) — sugeridas
Crear archivo: __tests__/DashboardLayout.test.tsx
=====================================================

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardLayout from '../src/components/layout/DashboardLayout';

// Smoke test: render sin errores
it('renderiza el layout sin crashear', () => {
  render(<DashboardLayout />);
  expect(screen.getByTestId('topbar')).toBeInTheDocument();
  expect(screen.getByTestId('simulation-button')).toBeInTheDocument();
});

// Interacción: abre sidebar
it('abre el sidebar al hacer click en el botón hamburguesa', async () => {
  const user = userEvent.setup();
  render(<DashboardLayout />);
  await user.click(screen.getByTestId('open-sidebar'));
  expect(await screen.findByText('Menú principal')).toBeInTheDocument();
});

// Interacción: abre panel derecho de información
it('abre el panel de información al hacer click en Más información', async () => {
  const user = userEvent.setup();
  render(<DashboardLayout />);
  await user.click(screen.getByTestId('open-info'));
  expect(await screen.findByText('Información del sistema')).toBeInTheDocument();
});

// Nuevo: cerrar al hacer click sobre el overlay
it('cierra el panel de información al hacer click fuera (overlay)', async () => {
  const user = userEvent.setup();
  render(<DashboardLayout />);
  await user.click(screen.getByTestId('open-info'));
  const overlay = document.querySelector('[aria-hidden="true"]') as HTMLElement;
  await user.click(overlay);
  // El título debería desaparecer
  expect(screen.queryByText('Información del sistema')).not.toBeInTheDocument();
});

*/

/*
Notas de integración
--------------------
1) Este archivo ya no depende de `../ui/*` ni del alias `@`. Si quieres volver a usar
   shadcn/ui, reemplaza los componentes locales por los oficiales e importa según tu árbol.

2) Estilos: usa Tailwind. Si no tienes clases de color `teal`, ajusta por los tokens de tu tema.

3) Comportamiento esperado (confírmame si es así):
   - Sidebar: se abre desde el botón hamburguesa y se cierra con overlay o tecla ESC.
   - Panel derecho: igual comportamiento.
   - Botón “Simulación” centrado en la parte inferior.

4) Si prefieres que en desktop el sidebar sea persistente (no overlay), dime y te envío la
   variante responsive (con breakpoint para "push layout").
*/
