import * as Router from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import MapPage from './pages/MapPage'
import OrdersPage from './pages/OrderPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Router.Routes>
      <Router.Route path="/" element={<DashboardLayout />}>
        <Router.Route index element={<MapPage />} />
        <Router.Route path="/orders" element={<OrdersPage />} />
        <Router.Route path="/settings" element={<SettingsPage />} />
      </Router.Route>
    </Router.Routes>
  )
}
