'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewJobPostingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    description: '',
    requirements: '',
    location: '',
    employmentType: 'FULL_TIME',
    salaryRange: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.title || !formData.department || !formData.description || !formData.requirements) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/recruitment/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'OPEN',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Có lỗi xảy ra')
      }

      const job = await response.json()
      router.push(`/recruitment/${job.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo tin tuyển dụng')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/recruitment">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Đăng tin tuyển dụng</h1>
          <p className="text-gray-600 mt-2">
            Tạo tin tuyển dụng mới
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
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                placeholder="Ví dụ: Senior Software Developer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phòng ban <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                placeholder="Ví dụ: IT"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả công việc <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="Mô tả chi tiết về công việc..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yêu cầu <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="Yêu cầu về kinh nghiệm, kỹ năng, bằng cấp..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa điểm
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ví dụ: Hà Nội"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại hình
              </label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="FULL_TIME">Toàn thời gian</option>
                <option value="PART_TIME">Bán thời gian</option>
                <option value="CONTRACT">Hợp đồng</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mức lương
              </label>
              <input
                type="text"
                value={formData.salaryRange}
                onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ví dụ: 15,000,000 - 25,000,000 VND"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Đăng tin tuyển dụng'}
            </Button>
            <Link href="/recruitment">
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








