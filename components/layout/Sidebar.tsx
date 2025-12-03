'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Clock,
  DollarSign,
  TrendingUp,
  GraduationCap,
  Calendar,
  BarChart3,
  LogOut,
  FileText,
  Shield,
  FolderOpen,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employees', label: 'Nhân viên', icon: Users },
  { href: '/recruitment', label: 'Tuyển dụng', icon: Briefcase },
  { href: '/timekeeping', label: 'Chấm công', icon: Clock },
  { href: '/payroll', label: 'Lương thưởng', icon: DollarSign },
  { href: '/performance', label: 'Đánh giá', icon: TrendingUp },
  { href: '/training', label: 'Đào tạo', icon: GraduationCap },
  { href: '/leave', label: 'Nghỉ phép', icon: Calendar },
  { href: '/contracts', label: 'Hợp đồng', icon: FileText },
  { href: '/documents', label: 'Tài liệu', icon: FolderOpen },
  { href: '/insurance', label: 'Bảo hiểm', icon: Shield },
  { href: '/reports', label: 'Báo cáo', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col shadow-sm z-50">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
        <h1 className="text-xl font-bold text-primary-700">HRMS System</h1>
        <p className="text-sm text-gray-500">Quản lý Nhân sự</p>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin" style={{ scrollbarGutter: 'stable' }}>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out',
                    'group',
                    isActive
                      ? 'bg-primary-600 text-white font-medium shadow-lg transform scale-[1.02]'
                      : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1 hover:shadow-sm'
                  )}
                >
                  {/* Active indicator bar - slide in từ trái */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full animate-slide-in shadow-sm" />
                  )}
                  
                  {/* Icon với animation */}
                  <Icon 
                    className={cn(
                      'h-5 w-5 transition-all duration-300 relative z-10',
                      isActive 
                        ? 'text-white scale-110 drop-shadow-sm' 
                        : 'text-gray-600 group-hover:text-primary-600 group-hover:scale-110'
                    )} 
                  />
                  
                  {/* Text với animation */}
                  <span className={cn(
                    'transition-all duration-300 relative z-10',
                    isActive 
                      ? 'text-white font-semibold drop-shadow-sm' 
                      : 'group-hover:text-primary-600'
                  )}>
                    {item.label}
                  </span>
                  
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 w-full transition-all duration-300 hover:translate-x-1 group"
        >
          <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
          <span className="transition-colors duration-300">Đăng xuất</span>
        </button>
      </div>
    </div>
  )
}

