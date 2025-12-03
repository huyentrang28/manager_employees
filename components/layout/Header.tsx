'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Bell, Search, X } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  link: string | null
  createdAt: string
}

interface SearchResult {
  employees: any[]
  jobs: any[]
}

export function Header() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<SearchResult>({ employees: [], jobs: [] })
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  useEffect(() => {
    // Clear search when route changes
    setSearchQuery('')
    setShowResults(false)
    setResults({ employees: [], jobs: [] })
  }, [pathname])

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!session?.user?.id) return
    
    setLoadingNotifications(true)
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data || [])
        const unread = data.filter((n: Notification) => !n.isRead).length
        setUnreadCount(unread)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  useEffect(() => {
    // Chỉ chạy trên client
    if (typeof window === 'undefined') return
    
    if (session?.user?.id) {
      fetchNotifications()
      // Refresh notifications every 10 seconds để cập nhật nhanh hơn
      const interval = setInterval(fetchNotifications, 10000)
      
      // Refresh khi user quay lại tab/window
      const handleFocus = () => {
        fetchNotifications()
      }
      window.addEventListener('focus', handleFocus)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('focus', handleFocus)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showNotifications && !target.closest('.notification-dropdown')) {
        setShowNotifications(false)
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications])

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      })
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    setShowNotifications(false)
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setResults({ employees: [], jobs: [] })
      setShowResults(false)
      return
    }

    setLoading(true)
    try {
      // Search employees
      const employeesRes = await fetch(`/api/employees?search=${encodeURIComponent(query)}&limit=5`)
      const employeesData = await employeesRes.ok ? await employeesRes.json() : { employees: [] }

      // Search jobs
      const jobsRes = await fetch(`/api/recruitment/jobs`)
      const jobsData = await jobsRes.ok ? await jobsRes.json() : []
      const filteredJobs = jobsData.filter((job: any) =>
        job.title.toLowerCase().includes(query.toLowerCase()) ||
        job.department.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3)

      setResults({
        employees: employeesData.employees || [],
        jobs: filteredJobs || [],
      })
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    handleSearch(value)
  }

  const handleResultClick = (type: string, id: string) => {
    setShowResults(false)
    setSearchQuery('')
    if (type === 'employee') {
      router.push(`/employees/${id}`)
    } else if (type === 'job') {
      router.push(`/recruitment/${id}`)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 flex items-center justify-between px-6 z-40">
      <div className="flex-1 max-w-md relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên, tin tuyển dụng..."
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => {
              if (searchQuery && results) {
                setShowResults(true)
              }
            }}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setShowResults(false)
                setResults({ employees: [], jobs: [] })
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && (results.employees?.length > 0 || results.jobs?.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 text-sm">Đang tìm kiếm...</div>
            ) : (
              <>
                {results.employees && results.employees.length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Nhân viên
                    </div>
                    {results.employees.map((employee: any) => (
                      <button
                        key={employee.id}
                        onClick={() => handleResultClick('employee', employee.id)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded flex items-center gap-3"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {employee.employeeId} • {employee.department || 'N/A'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.jobs && results.jobs.length > 0 && (
                  <div className="p-2 border-t border-gray-200">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Tin tuyển dụng
                    </div>
                    {results.jobs.map((job: any) => (
                      <button
                        key={job.id}
                        onClick={() => handleResultClick('job', job.id)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded flex items-center gap-3"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {job.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {job.department} • {job.location || 'N/A'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {(!results.employees || results.employees.length === 0) && 
                 (!results.jobs || results.jobs.length === 0) && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Không tìm thấy kết quả
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative notification-dropdown">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Thông báo</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-gray-500">{unreadCount} chưa đọc</span>
                )}
              </div>
              
              <div className="overflow-y-auto">
                {loadingNotifications ? (
                  <div className="p-4 text-center text-gray-500 text-sm">Đang tải...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">Không có thông báo</div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                          !notification.isRead ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-1 min-w-0 ${!notification.isRead ? 'font-medium' : ''}`}>
                            <p className="text-sm text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notification.createdAt).toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {status === 'loading' ? (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-3 w-16 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        ) : session ? (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
              {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {session?.user?.email || 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {session?.user?.role?.toLowerCase() || 'user'}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}
