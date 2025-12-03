'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Briefcase, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface JobPosting {
  id: string
  title: string
  department: string
  description: string
  location: string | null
  status: string
  postedDate: Date
  _count: {
    applications: number
  }
}

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    fetchJobs()
  }, [search, status])

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data?.user?.role) {
          setUserRole(data.user.role)
        }
      })
  }, [])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (status) params.append('status', status)

      const response = await fetch(`/api/recruitment/jobs?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setJobs(data || [])
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const canCreate = userRole === 'HR' || userRole === 'BOARD'

  // Filter jobs client-side nếu API chưa hỗ trợ search
  const filteredJobs = jobs.filter(job => {
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        job.title.toLowerCase().includes(searchLower) ||
        job.department.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        (job.location && job.location.toLowerCase().includes(searchLower))
      )
    }
    if (status && job.status !== status) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tuyển dụng</h1>
          <p className="text-gray-600 mt-2">
            Quản lý các vị trí tuyển dụng và ứng viên
          </p>
        </div>
        {canCreate && (
          <Link href="/recruitment/new">
            <Button className='flex items-center gap-2'>
              <Plus className="h-5 w-5" />
              Đăng tin tuyển dụng
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
              placeholder="Tìm kiếm theo tiêu đề, phòng ban, mô tả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="OPEN">Đang mở</option>
            <option value="CLOSED">Đã đóng</option>
            <option value="FILLED">Đã tuyển</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {search || status ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có tin tuyển dụng nào'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {job.title}
                  </h3>
                  <p className="text-sm text-gray-500">{job.department}</p>
                </div>
                <Briefcase className="h-8 w-8 text-primary-500" />
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {job.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{job.location || 'N/A'}</span>
                  <span>•</span>
                  <span>{job._count.applications} ứng viên</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    job.status === 'OPEN'
                      ? 'bg-green-100 text-green-800'
                      : job.status === 'CLOSED'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {job.status}
                </span>
                <Link
                  href={`/recruitment/${job.id}`}
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
