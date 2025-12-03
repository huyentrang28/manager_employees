'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Briefcase, Building2, Users, MapPin, Calendar, ArrowRight, LogIn, UserPlus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface JobPosting {
  id: string
  title: string
  department: string
  description: string
  location: string | null
  employmentType: string | null
  salaryRange: string | null
  postedDate: Date
  closingDate: Date | null
}

export default function HomePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')

  useEffect(() => {
    fetchJobs()
  }, [search, department])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (department) params.append('department', department)

      const response = await fetch(`/api/recruitment/jobs/public?${params.toString()}`)
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


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">HRMS System</h1>
            </div>
            {status === 'loading' ? (
              <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
            ) : !session ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-primary-600 font-medium flex items-center gap-2 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Đăng ký
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {session.user?.role && session.user.role !== 'GUEST' && (
                  <Link
                    href="/dashboard"
                    className="text-gray-700 hover:text-primary-600 font-medium flex items-center gap-2 transition-colors"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Vào hệ thống
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">Chào mừng đến với HRMS System</h2>
            <p className="text-xl text-primary-100 mb-8">
              Hệ thống Quản lý Nhân sự chuyên nghiệp
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/about"
                className="bg-white text-primary-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Tìm hiểu thêm
              </Link>
              <Link
                href="#jobs"
                className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-400 transition-colors"
              >
                Xem việc làm
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Company Info Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Về chúng tôi</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Chúng tôi là một công ty chuyên nghiệp với đội ngũ nhân viên tài năng và đam mê.
              Chúng tôi luôn tìm kiếm những ứng viên xuất sắc để cùng phát triển.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Users className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Đội ngũ chuyên nghiệp</h3>
              <p className="text-gray-600">
                Với đội ngũ nhân viên giàu kinh nghiệm và tận tâm
              </p>
            </div>
            <div className="text-center">
              <Building2 className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Môi trường làm việc</h3>
              <p className="text-gray-600">
                Môi trường làm việc năng động, sáng tạo và hỗ trợ phát triển
              </p>
            </div>
            <div className="text-center">
              <Briefcase className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cơ hội phát triển</h3>
              <p className="text-gray-600">
                Nhiều cơ hội học hỏi và thăng tiến trong sự nghiệp
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      <section id="jobs" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Cơ hội việc làm</h2>
            <p className="text-lg text-gray-600">
              Khám phá các vị trí tuyển dụng hiện tại của chúng tôi
            </p>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tiêu đề, phòng ban..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Tất cả phòng ban</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Operations">Operations</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
          </div>

          {/* Jobs List */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Đang tải...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {search || department ? 'Không tìm thấy vị trí phù hợp' : 'Hiện tại chưa có vị trí tuyển dụng nào'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
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

                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {job.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    {job.location && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    {job.employmentType && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>{job.employmentType}</span>
                      </div>
                    )}
                    {job.salaryRange && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Lương:</span> {job.salaryRange}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      Đăng ngày: {formatDate(job.postedDate)}
                    </span>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-primary-600 hover:text-primary-900 text-sm font-medium flex items-center gap-1"
                    >
                      Xem chi tiết
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2025 HRMS System. All rights reserved.
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <Link href="/about" className="text-gray-400 hover:text-white">
                Về chúng tôi
              </Link>
              <Link href="#jobs" className="text-gray-400 hover:text-white">
                Tuyển dụng
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
