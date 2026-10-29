import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export const AppLayout = () => (
  <div className="flex min-h-screen">
    <Sidebar />
    <main className="min-w-0 flex-1 px-3 py-4 md:px-5">
      <Outlet />
    </main>
  </div>
)
