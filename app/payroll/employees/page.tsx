'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, Plus, Eye, Award } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

interface Employee {
  id: string
  employeeId: string
  name: string
  department: string | null
  position: string | null
  baseSalary: number
  totalPaid: number
  completedMonths: number
  hasContract: boolean
  contractStartDate: string | null
}

export default function PayrollEmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [showBonusForm, setShowBonusForm] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/payroll/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6">Đang tải...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Lương Nhân viên</h1>
          <p className="text-gray-600 mt-2">Xem và quản lý lương của từng nhân viên</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhân viên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phòng ban</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chức vụ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lương cơ bản</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tổng đã trả</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Chưa có nhân viên nào
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.employeeId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.position || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(employee.baseSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                      {formatCurrency(employee.totalPaid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/payroll/employees/${employee.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Chi tiết
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEmployee(employee.id)
                            setShowBonusForm(true)
                          }}
                        >
                          <Award className="h-4 w-4 mr-1" />
                          Thưởng
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showBonusForm && (
        <BonusFormModal
          employeeId={selectedEmployee!}
          employeeName={employees.find(e => e.id === selectedEmployee)?.name || ''}
          onClose={() => {
            setShowBonusForm(false)
            setSelectedEmployee(null)
          }}
          onSuccess={() => {
            fetchEmployees()
            setShowBonusForm(false)
            setSelectedEmployee(null)
          }}
        />
      )}
    </div>
  )
}

function BonusFormModal({
  employeeId,
  employeeName,
  onClose,
  onSuccess,
}: {
  employeeId: string
  employeeName: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    amount: '',
    payPeriod: '',
    reason: '',
    title: '',
  })

  // Tạo danh sách các tháng có thể chọn (12 tháng gần nhất)
  const getPayPeriodOptions = () => {
    const options = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const payPeriod = `${year}-${String(month).padStart(2, '0')}`
      const label = date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
      options.push({ value: payPeriod, label })
    }
    return options
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.amount || !formData.payPeriod) {
      setError('Vui lòng điền đầy đủ số tiền và tháng thưởng')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/payroll/bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          amount: parseFloat(formData.amount),
          payPeriod: formData.payPeriod,
          reason: formData.reason,
          title: formData.title || `Thưởng tháng ${formData.payPeriod}`,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Không thể thêm thưởng')
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi thêm thưởng')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Thêm thưởng cho {employeeName}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số tiền thưởng (VND) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              min="0"
              step="1000"
              placeholder="Ví dụ: 1000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tháng thưởng <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.payPeriod}
              onChange={(e) => setFormData({ ...formData, payPeriod: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Chọn tháng</option>
              {getPayPeriodOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ví dụ: Thưởng hiệu suất"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Lý do thưởng..."
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang thêm...' : 'Thêm thưởng'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}




