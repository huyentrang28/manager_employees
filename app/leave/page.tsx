'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Calendar, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface Leave {
  id: string
  type: string
  startDate: Date
  endDate: Date
  days: number
  status: string
  employee: {
    firstName: string
    lastName: string
    employeeId: string
    department: string | null
  }
}

export default function LeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    fetchLeaves()
  }, [search, status, type])

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data?.user?.role) {
          setUserRole(data.user.role)
        }
      })
  }, [])

  const fetchLeaves = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      if (search) params.append('search', search)
      if (type) params.append('type', type)

      const response = await fetch(`/api/leave?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setLeaves(data || [])
      }
    } catch (error) {
      console.error('Error fetching leaves:', error)
    } finally {
      setLoading(false)
    }
  }

  // Leaves are already filtered by API
  const filteredLeaves = leaves

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Nghỉ phép</h1>
          <p className="text-gray-600 mt-2">
            Xem và quản lý đơn xin nghỉ phép
          </p>
        </div>
        <Link href="/leave/new">
          <Button>
            <Plus className="h-5 w-5 mr-2" />
            Xin nghỉ phép
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          {userRole === 'BOARD' && (
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên nhân viên, mã NV, phòng ban..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Tất cả loại nghỉ</option>
            <option value="ANNUAL">Nghỉ phép năm</option>
            <option value="SICK">Nghỉ ốm</option>
            <option value="PERSONAL">Nghỉ cá nhân</option>
            <option value="MATERNITY">Nghỉ thai sản</option>
            <option value="PATERNITY">Nghỉ thai sản (bố)</option>
            <option value="UNPAID">Nghỉ không lương</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : filteredLeaves.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search || status || type ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có đơn nghỉ phép nào'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {userRole === 'BOARD' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nhân viên
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Loại nghỉ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Từ ngày
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Đến ngày
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số ngày
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    {userRole === 'BOARD' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.employee.firstName} {leave.employee.lastName}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {leave.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(leave.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(leave.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {leave.days} ngày
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          leave.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : leave.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/leave/${leave.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
