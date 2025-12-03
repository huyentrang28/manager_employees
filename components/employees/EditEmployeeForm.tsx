'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

const statusOptions = [
  { value: 'ACTIVE', label: 'Đang làm việc' },
  { value: 'ON_LEAVE', label: 'Đang nghỉ' },
  { value: 'INACTIVE', label: 'Không hoạt động' },
  { value: 'TERMINATED', label: 'Đã nghỉ việc' },
]

export interface EditableEmployee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  middleName?: string | null
  phone?: string | null
  department?: string | null
  position?: string | null
  hireDate: string
  status: string
  salary?: number | null
}

interface EditEmployeeFormProps {
  employee: EditableEmployee
}

export function EditEmployeeForm({ employee }: EditEmployeeFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: employee.firstName,
    lastName: employee.lastName,
    middleName: employee.middleName || '',
    phone: employee.phone || '',
    department: employee.department || '',
    position: employee.position || '',
    hireDate: employee.hireDate,
    status: employee.status,
    salary: employee.salary ? String(employee.salary) : '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName || null,
          phone: formData.phone || null,
          department: formData.department || null,
          position: formData.position || null,
          hireDate: new Date(formData.hireDate),
          status: formData.status,
          salary: formData.salary ? Number(formData.salary) : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Không thể cập nhật nhân viên')
      }

      setSuccess('Cập nhật thành công')
      router.push(`/employees/${employee.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mã nhân viên
          </label>
          <input
            type="text"
            value={employee.employeeId}
            disabled
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trạng thái
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Họ
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên đệm
          </label>
          <input
            type="text"
            value={formData.middleName}
            onChange={(e) => setFormData((prev) => ({ ...prev, middleName: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số điện thoại
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phòng ban
          </label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chức vụ
          </label>
          <input
            type="text"
            value={formData.position}
            onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày vào làm
          </label>
          <input
            type="date"
            value={formData.hireDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, hireDate: e.target.value }))}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lương cơ bản
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.salary}
            onChange={(e) => setFormData((prev) => ({ ...prev, salary: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  )
}








