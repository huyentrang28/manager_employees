'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, DollarSign, Calendar, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface SalaryHistoryItem {
  payPeriod: string
  year: number
  month: number
  monthName: string
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
  hasRecord: boolean
}

interface EmployeeSalaryData {
  employee: {
    id: string
    name: string
    employeeId: string
  }
  contract?: {
    contractNumber: string
    startDate: string
    salary: number
  }
  salaryHistory: SalaryHistoryItem[]
  totalPaid: number
  totalPending: number
  message?: string
}

export default function EmployeeSalaryDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [data, setData] = useState<EmployeeSalaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const employeeId = params?.id

  useEffect(() => {
    if (!employeeId) {
      console.error('Employee ID is missing')
      setLoading(false)
      return
    }

    fetchSalaryDetails()
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(sessionData => {
        if (sessionData?.user?.role) {
          setUserRole(sessionData.user.role)
        }
      })
      .catch(err => console.error('Error fetching session:', err))
  }, [employeeId])

  const fetchSalaryDetails = async () => {
    if (!employeeId) {
      console.error('Cannot fetch: employeeId is missing')
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/payroll/employees/${employeeId}`)
      if (response.ok) {
        const data = await response.json()
        setData(data)
      } else {
        try {
          const errorData = await response.json()
          console.error('Error fetching salary details:', errorData)
        } catch (jsonError) {
          const errorText = await response.text()
          console.error('Error fetching salary details (non-JSON):', errorText)
        }
        setData(null)
      }
    } catch (error: any) {
      console.error('Error fetching salary details:', error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (payPeriod: string, currentStatus: string) => {
    if (userRole !== 'BOARD') {
      return
    }

    if (!employeeId) {
      alert('Không tìm thấy ID nhân viên')
      return
    }

    setUpdatingStatus(payPeriod)
    try {
      const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID'
      const response = await fetch(`/api/payroll/employees/${employeeId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payPeriod,
          status: newStatus,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        // Refresh dữ liệu sau khi cập nhật
        await fetchSalaryDetails()
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

  if (loading) {
    return <div className="p-6">Đang tải...</div>
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Không tìm thấy thông tin lương
        </div>
        <Link href="/payroll/employees">
          <Button variant="outline" className="mt-4">
            Quay lại
          </Button>
        </Link>
      </div>
    )
  }

  if (!data.contract) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          Nhân viên chưa có hợp đồng
        </div>
        <Link href="/payroll/employees">
          <Button variant="outline" className="mt-4">
            Quay lại
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/payroll/employees">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Chi tiết Lương: {data.employee.name}
          </h1>
          <p className="text-gray-600 mt-2">Mã NV: {data.employee.employeeId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng đã trả</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(data.totalPaid)}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chưa trả</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">
                {formatCurrency(data.totalPending)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lương cơ bản</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(data.contract?.salary || 0)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-gray-500" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử Lương theo tháng</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tháng</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lương cơ bản</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Phụ cấp</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Làm thêm</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thưởng</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tổng thu nhập</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Khấu trừ</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thuế</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thực nhận</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.salaryHistory.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-4 text-center text-gray-500">
                    Chưa có dữ liệu lương
                  </td>
                </tr>
              ) : (
                data.salaryHistory.map((month) => (
                  <tr key={month.payPeriod} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {month.monthName}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {formatCurrency(month.baseSalary)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      {formatCurrency(month.allowances)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      {formatCurrency(month.overtime)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                      {formatCurrency(month.bonuses)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-blue-600 font-semibold">
                      {formatCurrency(month.grossPay)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">
                      {formatCurrency(month.deductions)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">
                      {formatCurrency(month.tax)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                      {formatCurrency(month.netPay)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {userRole === 'BOARD' ? (
                          <button
                            onClick={() => toggleStatus(month.payPeriod, month.status)}
                            disabled={updatingStatus === month.payPeriod}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                              month.status === 'PAID'
                                ? 'bg-green-500'
                                : 'bg-gray-300'
                            } ${updatingStatus === month.payPeriod ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={month.status === 'PAID' ? 'Chuyển sang Chưa trả' : 'Chuyển sang Đã trả'}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                month.status === 'PAID' ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        ) : (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              month.status === 'PAID'
                                ? 'bg-green-100 text-green-800'
                                : month.status === 'PROCESSED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {month.status === 'PAID' ? 'Đã trả' : month.status === 'PROCESSED' ? 'Đã xử lý' : 'Chưa trả'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

