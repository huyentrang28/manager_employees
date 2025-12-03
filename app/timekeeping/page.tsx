'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, CheckCircle, Search, Calendar } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface Attendance {
  id: string
  date: Date
  checkIn: Date | null
  checkOut: Date | null
  totalHours: number | null
  status: string
  employee: {
    firstName: string
    lastName: string
    employeeId: string
  }
}

export default function TimekeepingPage() {
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    fetchAttendance()
  }, [startDate, endDate, status, search])

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data?.user?.role) {
          setUserRole(data.user.role)
        }
      })
  }, [])

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (status) params.append('status', status)
      if (search) params.append('search', search)

      const response = await fetch(`/api/attendance?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setAttendances(data || [])
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  // Attendances are already filtered by API
  const filteredAttendances = attendances

  const stats = {
    totalDays: filteredAttendances.length,
    presentDays: filteredAttendances.filter(a => a.status === 'PRESENT').length,
    absentDays: filteredAttendances.filter(a => a.status === 'ABSENT').length,
    lateDays: filteredAttendances.filter(a => a.status === 'LATE').length,
  }

  // Set default date range to current month
  useEffect(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Chấm công</h1>
        <p className="text-gray-600 mt-2">
          Quản lý chấm công và thời gian làm việc
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng ngày</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.totalDays}
              </p>
            </div>
            <Clock className="h-8 w-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Có mặt</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {stats.presentDays}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vắng mặt</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {stats.absentDays}
              </p>
            </div>
            <Clock className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đi muộn</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">
                {stats.lateDays}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {userRole === 'BOARD' && (
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên nhân viên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <span className="text-gray-500">đến</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PRESENT">Có mặt</option>
            <option value="ABSENT">Vắng mặt</option>
            <option value="LATE">Đi muộn</option>
            <option value="HALF_DAY">Nửa ngày</option>
            <option value="ON_LEAVE">Nghỉ phép</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Lịch sử chấm công
          </h2>
          <Link
            href="/timekeeping/checkin"
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <Clock className="h-4 w-4" />
            Chấm công
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : filteredAttendances.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search || status ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có dữ liệu chấm công'}
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
                    Ngày
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vào
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tổng giờ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttendances.map((attendance) => (
                  <tr key={attendance.id} className="hover:bg-gray-50">
                    {userRole === 'BOARD' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attendance.employee.firstName} {attendance.employee.lastName}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(attendance.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {attendance.checkIn ? formatDateTime(attendance.checkIn) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {attendance.checkOut ? formatDateTime(attendance.checkOut) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {attendance.totalHours ? `${attendance.totalHours}h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          attendance.status === 'PRESENT'
                            ? 'bg-green-100 text-green-800'
                            : attendance.status === 'ABSENT'
                            ? 'bg-red-100 text-red-800'
                            : attendance.status === 'LATE'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {attendance.status}
                      </span>
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
