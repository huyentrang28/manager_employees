'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, Search, Calendar, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface PayrollRecord {
  id: string
  payPeriod: string
  baseSalary: number
  allowances: number
  overtime: number
  bonuses: number
  grossPay: number
  deductions: number
  tax: number
  netPay: number
  status: string
  paymentDate: string | null
  isEstimated?: boolean
  employeeId?: string
  employee: {
    firstName: string
    lastName: string
    employeeId: string
  }
}

export default function PayrollPage() {
  const router = useRouter()
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [payPeriod, setPayPeriod] = useState('')
  const [userRole, setUserRole] = useState('')
  const [totalStats, setTotalStats] = useState({
    totalPaidSalary: 0,
    totalPaidBonuses: 0,
    currentMonth: { period: '', salary: 0, bonuses: 0, count: 0 },
    currentYear: { year: '', salary: 0, bonuses: 0, count: 0 },
    monthlyBreakdown: [] as Array<{ period: string; year: string; month: string; salary: number; bonuses: number; count: number }>,
    yearlyBreakdown: [] as Array<{ year: string; salary: number; bonuses: number; count: number }>,
  })
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [filterPeriod, setFilterPeriod] = useState('') // Filter theo tháng/năm
  const [filterType, setFilterType] = useState<'all' | 'month' | 'year'>('all')
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    fetchPayroll()
  }, [payPeriod, status, search])

  useEffect(() => {
    fetchPayrollStats()
  }, [filterPeriod, filterType])

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data?.user?.role) {
          setUserRole(data.user.role)
        }
      })
  }, [])

  const fetchPayroll = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (payPeriod) params.append('payPeriod', payPeriod)
      if (status) params.append('status', status)
      if (search) params.append('search', search)
      if (userRole === 'EMPLOYEE') {
        // Employee chỉ xem được của mình
      }

      const response = await fetch(`/api/payroll?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setRecords(data || [])
      }
    } catch (error) {
      console.error('Error fetching payroll:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPayrollStats = async () => {
    setLoadingStats(true)
    try {
      const params = new URLSearchParams()
      if (filterType === 'month' && filterPeriod) {
        params.append('period', filterPeriod)
      } else if (filterType === 'year' && filterPeriod) {
        params.append('year', filterPeriod)
      }

      const response = await fetch(`/api/payroll/stats?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTotalStats({
          totalPaidSalary: data.totalPaidSalary || 0,
          totalPaidBonuses: data.totalPaidBonuses || 0,
          currentMonth: data.currentMonth || { period: '', salary: 0, bonuses: 0, count: 0 },
          currentYear: data.currentYear || { year: '', salary: 0, bonuses: 0, count: 0 },
          monthlyBreakdown: data.monthlyBreakdown || [],
          yearlyBreakdown: data.yearlyBreakdown || [],
        })
      } else {
        console.error('Failed to fetch payroll stats:', response.status)
      }
    } catch (error) {
      console.error('Error fetching payroll stats:', error)
      // Set default values on error
      setTotalStats({
        totalPaidSalary: 0,
        totalPaidBonuses: 0,
        currentMonth: { period: '', salary: 0, bonuses: 0, count: 0 },
        currentYear: { year: '', salary: 0, bonuses: 0, count: 0 },
        monthlyBreakdown: [],
        yearlyBreakdown: [],
      })
    } finally {
      setLoadingStats(false)
    }
  }

  const toggleStatus = async (record: PayrollRecord) => {
    if (userRole !== 'BOARD') {
      return
    }

    // Nếu là record ước tính (isEstimated), cần tạo PayrollRecord mới
    if (record.isEstimated) {
      // Chuyển đến trang chi tiết nhân viên để cập nhật
      if (record.employeeId) {
        router.push(`/payroll/employees/${record.employeeId}`)
      }
      return
    }

    setUpdatingStatus(record.id)
    try {
      const newStatus = record.status === 'PAID' ? 'PENDING' : 'PAID'
      const response = await fetch(`/api/payroll/${record.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        // Refresh dữ liệu sau khi cập nhật
        await fetchPayroll()
        await fetchPayrollStats()
      } else {
        alert(`Lỗi: ${data.error || 'Không thể cập nhật trạng thái'}`)
      }
    } catch (error: any) {
      console.error('Error updating status:', error)
      alert('Có lỗi xảy ra khi cập nhật trạng thái')
    } finally {
      setUpdatingStatus(null)
    }
  }

  // Records are already filtered by API
  const filteredRecords = records

  // Thu nhập từ dự án (cố định)
  const projectIncome = 20000000000

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lương thưởng</h1>
          <p className="text-gray-600 mt-2">
            Quản lý bảng lương và thanh toán
          </p>
        </div>
        {userRole === 'BOARD' ? (
          <Button onClick={() => router.push('/payroll/employees')}>
            <DollarSign className="h-4 w-4 mr-2" />
            Quản lý lương nhân viên
          </Button>
        ) : null}
      </div>

      {(userRole === 'BOARD') && (
        <>
          {/* Filter theo thời gian */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-sm font-medium text-gray-700">Lọc theo:</label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as 'all' | 'month' | 'year')
                  setFilterPeriod('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="month">Theo tháng</option>
                <option value="year">Theo năm</option>
              </select>
              {filterType === 'month' && (
                <input
                  type="month"
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              )}
              {filterType === 'year' && (
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Chọn năm</option>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  })}
                </select>
              )}
            </div>
          </div>

          {/* Cards tổng quan */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {filterType === 'month' && filterPeriod
                      ? `Lương tháng ${filterPeriod.split('-')[1]}/${filterPeriod.split('-')[0]}`
                      : filterType === 'year' && filterPeriod
                      ? `Lương năm ${filterPeriod}`
                      : 'Tổng lương đã trả'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {formatCurrency(totalStats.totalPaidSalary)}
                  </p>
                  {filterType === 'all' && totalStats.currentMonth.salary > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Tháng này: {formatCurrency(totalStats.currentMonth.salary)}
                    </p>
                  )}
                </div>
                <DollarSign className="h-8 w-8 text-primary-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {filterType === 'month' && filterPeriod
                      ? `Thưởng tháng ${filterPeriod.split('-')[1]}/${filterPeriod.split('-')[0]}`
                      : filterType === 'year' && filterPeriod
                      ? `Thưởng năm ${filterPeriod}`
                      : 'Tổng thưởng đã trả'}
                  </p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {formatCurrency(totalStats.totalPaidBonuses)}
                  </p>
                  {filterType === 'all' && totalStats.currentMonth.bonuses > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Tháng này: {formatCurrency(totalStats.currentMonth.bonuses)}
                    </p>
                  )}
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Thu nhập từ dự án</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {formatCurrency(projectIncome)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Lương năm hiện tại
                  </p>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {formatCurrency(totalStats.currentYear.salary)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {totalStats.currentYear.count} bản ghi
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Bảng tổng hợp theo tháng */}
          {totalStats.monthlyBreakdown.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {filterType === 'year' && filterPeriod
                  ? `Tổng hợp theo tháng năm ${filterPeriod}`
                  : 'Tổng hợp theo tháng (12 tháng gần nhất)'}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Kỳ lương
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Số bản ghi
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Tổng lương
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Tổng thưởng
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Tổng cộng
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(filterType === 'year' && filterPeriod
                      ? totalStats.monthlyBreakdown
                      : totalStats.monthlyBreakdown.slice(0, 12)
                    ).map((month) => (
                      <tr key={month.period} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          Tháng {month.month}/{month.year}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {month.count}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {formatCurrency(month.salary)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">
                          {formatCurrency(month.bonuses)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">
                          {formatCurrency(month.salary + month.bonuses)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên nhân viên, mã NV, kỳ lương..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="month"
              value={payPeriod}
              onChange={(e) => setPayPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="PROCESSED">Đã xử lý</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search || status || payPeriod ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có bản ghi lương nào'}
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
                    Kỳ lương
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Lương cơ bản
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thưởng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tổng lương
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Khấu trừ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thuế
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Lương thực nhận
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => {
                  // Tổng lương = lương cơ bản + thưởng
                  const totalSalary = record.baseSalary + record.bonuses
                  
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      {userRole === 'BOARD' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.employee.firstName} {record.employee.lastName}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {record.payPeriod ? (
                          `Tháng ${record.payPeriod.split('-')[1]}/${record.payPeriod.split('-')[0]}`
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(record.baseSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(record.bonuses)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                        {formatCurrency(totalSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {formatCurrency(record.deductions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {formatCurrency(record.tax)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        {formatCurrency(record.netPay)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {userRole === 'BOARD' ? (
                            <button
                              onClick={() => toggleStatus(record)}
                              disabled={updatingStatus === record.id}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                                record.status === 'PAID'
                                  ? 'bg-green-500'
                                  : 'bg-gray-300'
                              } ${updatingStatus === record.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              title={record.status === 'PAID' ? 'Chuyển sang Chưa trả' : 'Chuyển sang Đã trả'}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  record.status === 'PAID' ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          ) : (
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                record.status === 'PAID'
                                  ? 'bg-green-100 text-green-800'
                                  : record.status === 'PROCESSED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : record.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {record.status === 'PAID' ? 'Đã trả' : record.status === 'PROCESSED' ? 'Đã xử lý' : record.status === 'PENDING' ? 'Chờ xử lý' : record.status}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
