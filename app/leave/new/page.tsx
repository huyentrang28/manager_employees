'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewLeavePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    type: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: '',
  })

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays > 0 ? diffDays : 0
  }

  const days = calculateDays(formData.startDate, formData.endDate)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.startDate || !formData.endDate) {
      setError('Vui lòng chọn ngày bắt đầu và ngày kết thúc')
      setLoading(false)
      return
    }

    if (days <= 0) {
      setError('Ngày kết thúc phải sau ngày bắt đầu')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          days,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Có lỗi xảy ra')
      }

      router.push('/leave')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo đơn nghỉ phép')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/leave">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Xin nghỉ phép</h1>
          <p className="text-gray-600 mt-2">
            Điền thông tin để gửi đơn xin nghỉ phép
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại nghỉ phép
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="ANNUAL">Nghỉ phép năm</option>
              <option value="SICK">Nghỉ ốm</option>
              <option value="PERSONAL">Nghỉ cá nhân</option>
              <option value="MATERNITY">Nghỉ thai sản</option>
              <option value="PATERNITY">Nghỉ thai sản (bố)</option>
              <option value="UNPAID">Nghỉ không lương</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày kết thúc
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {days > 0 && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
              Số ngày nghỉ: <strong>{days} ngày</strong>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do nghỉ phép
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Nhập lý do nghỉ phép..."
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi đơn nghỉ phép'}
            </Button>
            <Link href="/leave">
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








