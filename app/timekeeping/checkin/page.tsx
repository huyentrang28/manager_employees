'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CheckInPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [formData, setFormData] = useState({
    notes: '',
  })

  // Cập nhật thời gian hiện tại mỗi giây
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Sử dụng thời gian thực tế hiện tại
      const now = new Date()
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: now,
          checkIn: now,
          notes: formData.notes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Có lỗi xảy ra')
      }

      setSuccess('Chấm công thành công!')
      setTimeout(() => {
        router.push('/timekeeping')
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi chấm công')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/timekeeping">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chấm công</h1>
          <p className="text-gray-600 mt-2">
            Ghi nhận thời gian vào làm
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

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày
              </label>
              <input
                type="text"
                value={currentTime.toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">Thời gian thực tế (không thể chỉnh sửa)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giờ vào
              </label>
              <input
                type="text"
                value={currentTime.toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                {currentTime.getHours() >= 9 
                  ? '⚠️ Bạn đang chấm công sau 9h sáng (sẽ bị tính là đi muộn)' 
                  : '✓ Chấm công trước 9h sáng'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú (tùy chọn)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Nhập ghi chú nếu có..."
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              <Clock className="h-4 w-4 mr-2" />
              {loading ? 'Đang chấm công...' : 'Chấm công'}
            </Button>
            <Link href="/timekeeping">
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


