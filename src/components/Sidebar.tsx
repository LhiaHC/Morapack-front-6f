import { NavLink } from 'react-router-dom'
import { Map, Package, Settings } from 'lucide-react'

function cx(...v:(string|false|null|undefined)[]){ return v.filter(Boolean).join(' ') }

const baseItem =
  'relative flex items-center gap-3 px-3 py-2 rounded-xl transition-colors outline-none ring-offset-2 ' +
  'hover:bg-[hsl(var(--muted))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]'

const activeItem =
  'bg-[hsl(var(--muted))] font-semibold text-[hsl(var(--foreground))] ' +
  'before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1.5 before:rounded-r-full before:bg-[hsl(var(--foreground))]/90'

export default function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  return (
    // Force sidebar background & text color using the CSS variables from global.css
    <nav className="p-3 space-y-1 h-full bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-foreground))]">
      {!collapsed && <p className="px-2 pb-2 text-[10px] uppercase tracking-wider opacity-60">Navegación</p>}

      <div className="grid gap-1">
        <NavLink to="/" end className={({isActive}) => cx(baseItem, isActive && activeItem)} title="Mapa">
          <Map className="h-4 w-4" />
          {!collapsed && <span>Mapa</span>}
        </NavLink>
        

        <NavLink to="/aeropuertos" className={({isActive}) => cx(baseItem, isActive && activeItem)} title="Aeropuertos">
          <Package className="h-4 w-4" />
          {!collapsed && <span>Aeropuertos</span>}
        </NavLink>

        <NavLink to="/settings" className={({isActive}) => cx(baseItem, isActive && activeItem)} title="Vuelos">
          <Settings className="h-4 w-4" />
          {!collapsed && <span>Vuelos</span>}
        </NavLink>
      </div>

      
    </nav>
  )
}
