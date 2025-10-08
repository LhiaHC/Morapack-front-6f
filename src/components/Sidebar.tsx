import { NavLink } from 'react-router-dom'
import { Map, Package, Settings } from 'lucide-react'

const item = 'flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted'
const active = 'bg-muted font-semibold'

export default function Sidebar() {
  return (
    <nav className="p-3 space-y-1">
      <NavLink to="/" end className={({isActive}) => `${item} ${isActive?active:''}`}>
        <Map className="h-4 w-4" /> Mapa
      </NavLink>

      <NavLink to="/orders" className={({isActive}) => `${item} ${isActive?active:''}`}>
        <Package className="h-4 w-4" /> Pedidos
      </NavLink>

      <NavLink to="/settings" className={({isActive}) => `${item} ${isActive?active:''}`}>
        <Settings className="h-4 w-4" /> Configuración
      </NavLink>
    </nav>
  )
}
