'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

// Danh sách các trang public không cần sidebar và header
const publicRoutes = ['/login', '/register', '/about', '/']
const publicRoutePrefixes = ['/jobs/']

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Kiểm tra nếu là public route
  const isPublicRoute = 
    pathname && (
      publicRoutes.includes(pathname) || 
      publicRoutePrefixes.some(prefix => pathname.startsWith(prefix))
    )
  
  // Hiển thị children trực tiếp cho public routes
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Tránh hydration mismatch - chỉ render layout sau khi component đã mount trên client
  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1 ml-64 min-h-screen">
          <main className="mt-16 p-6 min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </div>
      </div>
    )
  }

  // Render layout với sidebar và header cho protected routes
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 min-h-screen">
        <Header />
        <main className="mt-16 p-6 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}

