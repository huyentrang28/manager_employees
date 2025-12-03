'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewEmployeePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    employeeId: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    middleName: '',
    phone: '',
    department: '',
    position: '',
    hireDate: new Date().toISOString().split('T')[0],
    salary: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.employeeId || !formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc')
      setLoading(false)
      return
    }

    try {
      // First create user
      const userResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: 'EMPLOYEE',
        }),
      })

      if (!userResponse.ok) {
        const data = await userResponse.json()
        throw new Error(data.error || 'Có lỗi xảy ra khi tạo tài khoản')
      }

      const user = await userResponse.json()

      // Then create employee
      const employeeResponse = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          employeeId: formData.employeeId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName || null,
          phone: formData.phone || null,
          department: formData.department || null,
          position: formData.position || null,
          hireDate: new Date(formData.hireDate),
          salary: formData.salary ? parseFloat(formData.salary) : null,
        }),
      })

      if (!employeeResponse.ok) {
        const data = await employeeResponse.json()
        throw new Error(data.error || 'Có lỗi xảy ra khi tạo nhân viên')
      }

      const employee = await employeeResponse.json()
      router.push(`/employees/${employee.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo nhân viên')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thêm nhân viên mới</h1>
          <p className="text-gray-600 mt-2">
            Tạo tài khoản và thông tin nhân viên mới
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
                Mã nhân viên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                placeholder="EMP001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                placeholder="employee@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                minLength={6}
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày vào làm <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên đệm
              </label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ví dụ: IT"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chức vụ
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ví dụ: Developer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lương cơ bản
            </label>
            <input
              type="number"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ví dụ: 15000000"
              min="0"
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo nhân viên'}
            </Button>
            <Link href="/employees">
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








