'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

const statusOptions = [
  { value: 'PLANNED', label: 'Đã lên kế hoạch' },
  { value: 'ONGOING', label: 'Đang diễn ra' },
  { value: 'COMPLETED', label: 'Đã hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

export function NewTrainingForm() {
  const router = useRouter()
  const parseNumber = (value: string) => {
    if (!value) return null
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    duration: '',
    provider: '',
    cost: '',
    startDate: '',
    endDate: '',
    status: 'PLANNED',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.title || !formData.description) {
      setError('Vui lòng nhập tiêu đề và mô tả')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category || null,
          duration: parseNumber(formData.duration),
          provider: formData.provider || null,
          cost: parseNumber(formData.cost),
          startDate: formData.startDate ? new Date(formData.startDate) : null,
          endDate: formData.endDate ? new Date(formData.endDate) : null,
          status: formData.status,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Không thể tạo chương trình đào tạo')
      }

      router.push('/training')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo chương trình')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-4xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tiêu đề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Danh mục
          </label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
            placeholder="Ví dụ: Kỹ năng mềm"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mô tả <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={5}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Mô tả chi tiết chương trình đào tạo..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thời lượng (giờ)
          </label>
          <input
            type="number"
            min="0"
            value={formData.duration}
            onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Đơn vị đào tạo
          </label>
          <input
            type="text"
            value={formData.provider}
            onChange={(e) => setFormData((prev) => ({ ...prev, provider: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chi phí (VND)
          </label>
          <input
            type="number"
            min="0"
            value={formData.cost}
            onChange={(e) => setFormData((prev) => ({ ...prev, cost: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày bắt đầu
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày kết thúc
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Đang tạo...' : 'Tạo chương trình'}
        </Button>
      </div>
    </form>
  )
}


