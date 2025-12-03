'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  department?: string | null
  position?: string | null
}

export default function NewContractPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [error, setError] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [formData, setFormData] = useState({
    employeeId: '',
    contractNumber: '',
    contractType: 'PERMANENT',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isIndefinite: false,
    salary: '',
    position: '',
    department: '',
    document: '',
    notes: '',
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees?status=ACTIVE')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoadingEmployees(false)
    }
  }

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId)
    setFormData({
      ...formData,
      employeeId,
      position: employee?.position || '',
      department: employee?.department || '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.employeeId || !formData.contractNumber || !formData.contractType || !formData.startDate || !formData.document) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc')
      setLoading(false)
      return
    }

    // Validate end date if not indefinite and not permanent contract
    const isPermanentOrIndefinite = formData.contractType === 'PERMANENT' || formData.isIndefinite
    if (!isPermanentOrIndefinite && !formData.endDate) {
      setError('Vui lòng nhập ngày kết thúc hoặc chọn hợp đồng không xác định thời hạn')
      setLoading(false)
      return
    }

    // Validate end date is after start date (only if end date is provided and contract has end date)
    if (formData.endDate && !isPermanentOrIndefinite && new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('Ngày kết thúc phải sau ngày bắt đầu')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: formData.employeeId,
          contractNumber: formData.contractNumber,
          contractType: formData.contractType,
          startDate: new Date(formData.startDate),
          endDate: formData.isIndefinite ? null : (formData.endDate ? new Date(formData.endDate) : null),
          isIndefinite: formData.isIndefinite,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          position: formData.position || null,
          department: formData.department || null,
          document: formData.document || null,
          notes: formData.notes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Có lỗi xảy ra khi tạo hợp đồng')
      }

      const contract = await response.json()
      
      // Trigger notification check for expiring contracts
      try {
        await fetch('/api/contracts/check-expiring', { method: 'POST' })
      } catch (err) {
        console.error('Error checking expiring contracts:', err)
      }

      router.push(`/contracts`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo hợp đồng')
    } finally {
      setLoading(false)
    }
  }

  const contractTypes = [
    { value: 'PERMANENT', label: 'Hợp đồng không xác định thời hạn' },
    { value: 'TEMPORARY', label: 'Hợp đồng có thời hạn' },
    { value: 'PROBATION', label: 'Hợp đồng thử việc' },
    { value: 'SEASONAL', label: 'Hợp đồng theo mùa' },
    { value: 'PART_TIME', label: 'Hợp đồng bán thời gian' },
  ]

  const departments = [
    'Phòng Nhân sự',
    'Phòng Kế toán',
    'Phòng Kinh doanh',
    'Phòng Marketing',
    'Phòng IT',
    'Phòng Hành chính',
    'Phòng Sản xuất',
    'Phòng Chất lượng',
    'Phòng Kỹ thuật',
    'Phòng Dự án',
    'Ban Giám đốc',
    'Phòng Pháp chế',
    'Phòng Mua hàng',
    'Phòng Bán hàng',
    'Phòng Chăm sóc khách hàng',
  ]

  const positions = [
    'Giám đốc',
    'Phó Giám đốc',
    'Trưởng phòng',
    'Phó phòng',
    'Trưởng nhóm',
    'Nhân viên',
    'Chuyên viên',
    'Kỹ sư',
    'Lập trình viên',
    'Thiết kế',
    'Kế toán trưởng',
    'Kế toán viên',
    'Nhân viên kinh doanh',
    'Nhân viên marketing',
    'Nhân viên hành chính',
    'Nhân viên nhân sự',
    'Thư ký',
    'Bảo vệ',
    'Tạp vụ',
    'Tư vấn viên',
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contracts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thêm hợp đồng lao động mới</h1>
          <p className="text-gray-600 mt-2">
            Tạo hợp đồng lao động cho nhân viên
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhân viên <span className="text-red-500">*</span>
              </label>
              {loadingEmployees ? (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  Đang tải...
                </div>
              ) : (
                <select
                  value={formData.employeeId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Chọn nhân viên</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.employeeId} - {employee.firstName} {employee.lastName}
                      {employee.department ? ` (${employee.department})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số hợp đồng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contractNumber}
                onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                placeholder="HD-2024-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại hợp đồng <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.contractType}
                onChange={(e) => {
                  const newContractType = e.target.value
                  const isPermanent = newContractType === 'PERMANENT'
                  setFormData({ 
                    ...formData, 
                    contractType: newContractType,
                    isIndefinite: isPermanent,
                    endDate: isPermanent ? '' : formData.endDate
                  })
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                {contractTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={formData.contractType === 'PERMANENT' || formData.isIndefinite}
                  disabled={formData.contractType === 'PERMANENT'}
                  onChange={(e) => {
                    if (formData.contractType !== 'PERMANENT') {
                      setFormData({ 
                        ...formData, 
                        isIndefinite: e.target.checked, 
                        endDate: e.target.checked ? '' : formData.endDate 
                      })
                    }
                  }}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm font-medium text-gray-700">
                  Hợp đồng không xác định thời hạn
                  {formData.contractType === 'PERMANENT' && (
                    <span className="ml-2 text-xs text-gray-500">(Tự động)</span>
                  )}
                </span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày kết thúc {!(formData.contractType === 'PERMANENT' || formData.isIndefinite) && <span className="text-red-500">*</span>}
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                disabled={formData.contractType === 'PERMANENT' || formData.isIndefinite}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                required={!(formData.contractType === 'PERMANENT' || formData.isIndefinite)}
                min={formData.startDate}
              />
              {(formData.contractType === 'PERMANENT' || formData.isIndefinite) && (
                <p className="mt-1 text-xs text-gray-500">
                  Hợp đồng không xác định thời hạn nên không cần nhập ngày kết thúc
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phòng ban
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Chọn phòng ban</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chức vụ
              </label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Chọn chức vụ</option>
                {positions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lương (VND)
            </label>
            <input
              type="number"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ví dụ: 15000000"
              min="0"
              step="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đường dẫn tài liệu <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={formData.document}
              onChange={(e) => setFormData({ ...formData, document: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://example.com/contract.pdf hoặc đường dẫn file"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Nhập URL hoặc đường dẫn đến file hợp đồng
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={4}
              placeholder="Ghi chú về hợp đồng..."
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo hợp đồng'}
            </Button>
            <Link href="/contracts">
              <Button type="button" variant="outline">
                Hủy
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

