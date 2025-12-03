'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface PerformanceReview {
  id: string
  employeeId: string
  reviewPeriod: string
  reviewDate: Date
  overallRating: string
  employee: {
    firstName: string
    lastName: string
    employeeId: string
    department: string | null
  }
}

export default function PerformancePage() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [rating, setRating] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [search, rating])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (rating) params.append('rating', rating)

      const response = await fetch(`/api/performance?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data || [])
      }
    } catch (error) {
      console.error('Error fetching performance reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  // Reviews are already filtered by API
  const filteredReviews = reviews

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Đánh giá Hiệu suất</h1>
        <p className="text-gray-600 mt-2">
          Quản lý đánh giá hiệu suất làm việc của nhân viên
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên nhân viên, mã NV, kỳ đánh giá..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Tất cả đánh giá</option>
            <option value="EXCELLENT">Xuất sắc</option>
            <option value="GOOD">Tốt</option>
            <option value="SATISFACTORY">Đạt yêu cầu</option>
            <option value="NEEDS_IMPROVEMENT">Cần cải thiện</option>
            <option value="UNSATISFACTORY">Không đạt</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search || rating ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có đánh giá hiệu suất nào'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nhân viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kỳ đánh giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ngày đánh giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Đánh giá tổng thể
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {review.employee.firstName} {review.employee.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {review.reviewPeriod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(review.reviewDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          review.overallRating === 'EXCELLENT'
                            ? 'bg-green-100 text-green-800'
                            : review.overallRating === 'GOOD'
                            ? 'bg-blue-100 text-blue-800'
                            : review.overallRating === 'SATISFACTORY'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {review.overallRating}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/performance/${review.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
