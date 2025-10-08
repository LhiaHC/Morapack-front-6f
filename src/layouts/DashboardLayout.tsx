import { Outlet, useLocation } from 'react-router-dom'

import Rightbar from '@/components/Rightbar'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'



export default function DashboardLayout() {
  const { pathname } = useLocation()

  return (
    <div className="app-grid">
      <div className="app-topbar border-b bg-white/70 backdrop-blur">
        <Topbar />
      </div>

      <aside className="app-sidebar border-r">
        <Sidebar />
      </aside>

      <main className="app-main">
        <Outlet />
      </main>

      <aside className="app-rightbar border-l">
        <Rightbar currentRoute={pathname} />
      </aside>
    </div>
  )
}
