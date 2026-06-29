'use client'

import { useState } from 'react'
import { AppSidebar } from './AppSidebar'
import { Topbar } from './Topbar'
import type { Profile } from '@/types'

interface DashboardLayoutProps {
  children: React.ReactNode
  profile: Profile | null
  isAdmin?: boolean
  unreadNotifications?: number
}

export function DashboardLayout({
  children,
  profile,
  isAdmin,
  unreadNotifications,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div data-dashboard className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <AppSidebar isAdmin={isAdmin} userRole={profile?.role} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">
            <AppSidebar
              isAdmin={isAdmin}
              userRole={profile?.role}
              onClose={() => setSidebarOpen(false)}
              isMobile
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          profile={profile}
          isAdmin={isAdmin}
          onMenuToggle={() => setSidebarOpen(true)}
          unreadNotifications={unreadNotifications}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="h-full p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
