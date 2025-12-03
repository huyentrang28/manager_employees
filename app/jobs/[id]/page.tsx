'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, DollarSign, FileText, Send, Building2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface JobPosting {
  id: string
  title: string
  department: string
  description: string
  requirements: string
  location: string | null
  employmentType: string | null
  salaryRange: string | null
  postedDate: Date
  closingDate: Date | null
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [job, setJob] = useState<JobPosting | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    resume: '',
    coverLetter: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchJob()
  }, [params.id])

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/recruitment/jobs/public`)
      if (response.ok) {
        const jobs = await response.json()
        const foundJob = jobs.find((j: JobPosting) => j.id === params.id)
        if (foundJob) {
          setJob(foundJob)
        }
      }
    } catch (error) {
      console.error('Error fetching job:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    setApplying(true)

    try {
      const response = await fetch('/api/recruitment/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobPostingId: params.id,
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ứng tuyển thất bại')
      }

      setSuccess(true)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        resume: '',
        coverLetter: '',
      })
      setTimeout(() => {
        setShowApplyForm(false)
        setSuccess(false)
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500">Đang tải...</div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy việc làm</h2>
          <Link href="/" className="text-primary-600 hover:text-primary-900">
            Về trang chủ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-700 hover:text-primary-600"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <p className="text-lg text-gray-600">{job.department}</p>
            </div>
            <Building2 className="h-12 w-12 text-primary-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {job.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-5 w-5" />
                <span>{job.location}</span>
              </div>
            )}
            {job.employmentType && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-5 w-5" />
                <span>{job.employmentType}</span>
              </div>
            )}
            {job.salaryRange && (
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="h-5 w-5" />
                <span>{job.salaryRange}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-5 w-5" />
              <span>Đăng ngày: {formatDate(job.postedDate)}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mô tả công việc</h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-line">
              {job.description}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Yêu cầu</h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-line">
              {job.requirements}
            </div>
          </div>

          {job.closingDate && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Hạn nộp hồ sơ:</strong> {formatDate(job.closingDate)}
              </p>
            </div>
          )}
        </div>

        {/* Apply Button */}
        {!showApplyForm && !success && (
          <div className="text-center">
            <button
              onClick={() => setShowApplyForm(true)}
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Send className="h-5 w-5" />
              Ứng tuyển ngay
            </button>
          </div>
        )}

        {/* Apply Form */}
        {showApplyForm && !success && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Đơn ứng tuyển</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleApply} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

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
                  Link CV/Resume
                </label>
                <input
                  type="url"
                  value={formData.resume}
                  onChange={(e) => setFormData({ ...formData, resume: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Vui lòng upload CV lên Google Drive hoặc Dropbox và dán link tại đây
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thư xin việc (Cover Letter)
                </label>
                <textarea
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Viết thư xin việc của bạn tại đây..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={applying}
                  className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {applying ? (
                    'Đang gửi...'
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Gửi đơn ứng tuyển
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowApplyForm(false)
                    setError('')
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <div className="text-green-600 mb-4">
              <FileText className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Đơn ứng tuyển đã được gửi thành công!
            </h3>
            <p className="text-gray-600 mb-4">
              Cảm ơn bạn đã quan tâm đến vị trí này. Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.
            </p>
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-900 font-medium"
            >
              Về trang chủ
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}



