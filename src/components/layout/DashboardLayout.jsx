import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isDivisionShellRoute = location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/division/') || location.pathname.startsWith('/dashboard/kalender') ||
    location.pathname.startsWith('/dashboard/monitoring') ||
    location.pathname.startsWith('/dashboard/laporan') ||
    location.pathname.startsWith('/dashboard/panduan') ||
    location.pathname === '/profile'

  if (isDivisionShellRoute) {
    return (
      <div className="min-h-screen bg-[#eef4fb] lg:flex">
        <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden overflow-y-auto">
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
