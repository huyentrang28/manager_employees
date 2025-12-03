'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Briefcase, MapPin, DollarSign, Calendar, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface JobPosting {
  id: string
  title: string
  department: string
  description: string
  requirements: string
  location: string | null
  salaryRange: string | null
  employmentType: string | null
  status: string
  postedDate: Date
  closingDate: Date | null
  _count: {
    applications: number
  }
  applications: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string | null
    resume?: string | null
    coverLetter?: string | null
    status: string
    appliedDate: Date
  }>
}

interface JobPostingDetailProps {
  job: JobPosting
  userRole: string
}

export function JobPostingDetail({ job, userRole }: JobPostingDetailProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(job.status)

  const canManage = userRole === 'HR' || userRole === 'BOARD'

  const handleStatusChange = async (newStatus: string) => {
    if (!canManage) return

    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/recruitment/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Có lỗi xảy ra')
      }

      setCurrentStatus(newStatus)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật trạng thái')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!canManage) return

    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/recruitment/jobs/${job.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Có lỗi xảy ra')
      }

      router.push('/recruitment')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi xóa tin tuyển dụng')
      setShowDeleteConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/recruitment">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-gray-600 mt-1">{job.department}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${
              currentStatus === 'OPEN'
                ? 'bg-green-100 text-green-800'
                : currentStatus === 'CLOSED'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {currentStatus}
          </span>
          {canManage && (
            <div className="flex items-center gap-2">
              <Link href={`/recruitment/${job.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Sửa
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận xóa</h3>
          <p className="text-sm text-gray-600 mb-4">
            Bạn có chắc chắn muốn xóa tin tuyển dụng "{job.title}"? Hành động này không thể hoàn tác.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Đang xóa...' : 'Xóa'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={loading}
            >
              Hủy
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mô tả công việc</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Yêu cầu</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line">{job.requirements}</p>
            </div>
          </div>

          {job.applications.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Ứng viên ({job._count.applications})
              </h2>
              <div className="space-y-4">
                {job.applications.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-lg">
                          {app.firstName} {app.lastName}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          📧 {app.email}
                        </div>
                        {app.phone && (
                          <div className="text-sm text-gray-600 mt-1">
                            📞 {app.phone}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-2">
                          Ứng tuyển: {formatDate(app.appliedDate)}
                        </div>
                        {app.resume && (
                          <div className="mt-2">
                            <a
                              href={app.resume}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary-600 hover:text-primary-900 underline"
                            >
                              📄 Xem CV/Resume
                            </a>
                          </div>
                        )}
                        {app.coverLetter && (
                          <div className="mt-2">
                            <details className="text-sm">
                              <summary className="text-primary-600 hover:text-primary-900 cursor-pointer">
                                📝 Xem thư xin việc
                              </summary>
                              <div className="mt-2 p-3 bg-gray-50 rounded text-gray-700 whitespace-pre-line">
                                {app.coverLetter}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          app.status === 'ACCEPTED'
                            ? 'bg-green-100 text-green-800'
                            : app.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : app.status === 'INTERVIEWED'
                            ? 'bg-blue-100 text-blue-800'
                            : app.status === 'OFFERED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {canManage && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thay đổi trạng thái
                  </label>
                  <div className="flex gap-2">
                    {currentStatus !== 'OPEN' && (
                      <Button
                        onClick={() => handleStatusChange('OPEN')}
                        disabled={loading}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mở
                      </Button>
                    )}
                    {currentStatus !== 'CLOSED' && (
                      <Button
                        onClick={() => handleStatusChange('CLOSED')}
                        disabled={loading}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Đóng
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin tuyển dụng</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Phòng ban
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{job.department}</dd>
              </div>
              {job.location && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Địa điểm
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.location}</dd>
                </div>
              )}
              {job.salaryRange && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Mức lương
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.salaryRange}</dd>
                </div>
              )}
              {job.employmentType && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Loại hình</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.employmentType}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ngày đăng
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(job.postedDate)}</dd>
              </div>
              {job.closingDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ngày đóng</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(job.closingDate)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}


