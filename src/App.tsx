import * as Router from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import MapPage from './pages/MapPage'
import OrdersPage from './pages/OrderPage'
import SettingsPage from './pages/SettingsPage'
import AirportsPage from './pages/AirportsPage'

// IMPORTA el Sidebar
import Sidebar from './components/Sidebar'

export default function App() {
  return (
    <Router.Routes>
      {/* Pasa SidebarContent y usa rutas hijas RELATIVAS */}
      <Router.Route path="/" element={<DashboardLayout SidebarContent={Sidebar} />}>
        <Router.Route index element={<MapPage />} />
        <Router.Route path="orders" element={<OrdersPage />} />
        <Router.Route path="settings" element={<SettingsPage />} />
        <Router.Route path="aeropuertos" element={<AirportsPage />} />
        <Router.Route path="vuelos" element={<AirportsPage />} />
      </Router.Route>
    </Router.Routes>
  )
}
