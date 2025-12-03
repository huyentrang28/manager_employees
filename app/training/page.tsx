'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, GraduationCap, Search } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface TrainingProgram {
  id: string
  title: string
  description: string
  category: string | null
  duration: number | null
  provider: string | null
  cost: number | null
  status: string
  _count: {
    enrollments: number
  }
}

export default function TrainingPage() {
  const [programs, setPrograms] = useState<TrainingProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    fetchPrograms()
  }, [search, category, status])

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data?.user?.role) {
          setUserRole(data.user.role)
        }
      })
  }, [])

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data?.user?.role) {
          setUserRole(data.user.role)
        }
      })
  }, [])

  const fetchPrograms = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (category) params.append('category', category)
      if (status) params.append('status', status)

      const response = await fetch(`/api/training?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPrograms(data || [])
      }
    } catch (error) {
      console.error('Error fetching training programs:', error)
    } finally {
      setLoading(false)
    }
  }

  const canCreate = userRole === 'HR' || userRole === 'BOARD'

  // Programs are already filtered by API
  const filteredPrograms = programs

  const categories = Array.from(new Set(programs.map(p => p.category).filter((cat): cat is string => Boolean(cat))))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Đào tạo & Phát triển</h1>
          <p className="text-gray-600 mt-2">
            Quản lý chương trình đào tạo và phát triển kỹ năng
          </p>
        </div>
        {canCreate && (
          <Link href="/training/new">
            <Button>
              <Plus className="h-5 w-5 mr-2" />
              Thêm chương trình
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, mô tả, danh mục..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          {categories.length > 0 && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PLANNED">Đã lên kế hoạch</option>
            <option value="ONGOING">Đang diễn ra</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : filteredPrograms.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {search || status || category ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có chương trình đào tạo nào'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <div
              key={program.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {program.title}
                  </h3>
                  <p className="text-sm text-gray-500">{program.category || 'N/A'}</p>
                </div>
                <GraduationCap className="h-8 w-8 text-primary-500" />
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {program.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{program.duration || 'N/A'} giờ</span>
                  <span>•</span>
                  <span>{program._count.enrollments} học viên</span>
                  {program.cost && (
                    <>
                      <span>•</span>
                      <span>{formatCurrency(program.cost)}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    program.status === 'ONGOING'
                      ? 'bg-green-100 text-green-800'
                      : program.status === 'COMPLETED'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {program.status}
                </span>
                <Link
                  href={`/training/${program.id}`}
                  className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                >
                  Xem chi tiết →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
