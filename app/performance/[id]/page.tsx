import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { ClipboardCheck } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'

function isValidObjectId(id: string) {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

async function getReview(id: string) {
  if (!isValidObjectId(id)) {
    return null
  }

  return prisma.performanceReview.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
          department: true,
          position: true,
        },
      },
    },
  })
}

export default async function PerformanceDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await Promise.resolve(params)
  const review = await getReview(resolvedParams.id)
  if (!review) {
    notFound()
  }

  if (
    session.user.role === 'EMPLOYEE' &&
    session.user.employeeId &&
    session.user.employeeId !== review.employeeId
  ) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/performance">
          <Button variant="outline" size="sm">
            Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chi tiết đánh giá hiệu suất</h1>
          <p className="text-gray-600 mt-2">
            {review.employee.firstName} {review.employee.lastName} • {review.reviewPeriod}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary-500" />
              Thông tin đánh giá
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Kỳ đánh giá</dt>
                <dd className="mt-1 text-sm text-gray-900">{review.reviewPeriod}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Ngày đánh giá</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(review.reviewDate)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Đánh giá tổng thể</dt>
                <dd className="mt-1">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                    {review.overallRating}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <section>
              <h3 className="text-md font-semibold text-gray-900 mb-2">Mục tiêu</h3>
              <p className="text-gray-700 whitespace-pre-line">{review.goals || '—'}</p>
            </section>
            <section>
              <h3 className="text-md font-semibold text-gray-900 mb-2">Thành tựu</h3>
              <p className="text-gray-700 whitespace-pre-line">{review.achievements || '—'}</p>
            </section>
            <section>
              <h3 className="text-md font-semibold text-gray-900 mb-2">Điểm mạnh</h3>
              <p className="text-gray-700 whitespace-pre-line">{review.strengths || '—'}</p>
            </section>
            <section>
              <h3 className="text-md font-semibold text-gray-900 mb-2">Cần cải thiện</h3>
              <p className="text-gray-700 whitespace-pre-line">{review.areasForImprovement || '—'}</p>
            </section>
            {review.comments && (
              <section>
                <h3 className="text-md font-semibold text-gray-900 mb-2">Nhận xét</h3>
                <p className="text-gray-700 whitespace-pre-line">{review.comments}</p>
              </section>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin nhân viên</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Họ và tên</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {review.employee.firstName} {review.employee.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Mã nhân viên</dt>
                <dd className="mt-1 text-sm text-gray-900">{review.employee.employeeId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phòng ban</dt>
                <dd className="mt-1 text-sm text-gray-900">{review.employee.department || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Chức vụ</dt>
                <dd className="mt-1 text-sm text-gray-900">{review.employee.position || '—'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}








