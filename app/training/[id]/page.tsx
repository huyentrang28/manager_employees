import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Users, GraduationCap, Clock } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { EnrollButton } from '@/components/training/EnrollButton'

function isValidObjectId(id: string) {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

async function getTrainingProgram(id: string) {
  if (!isValidObjectId(id)) {
    return null
  }

  return prisma.trainingProgram.findUnique({
    where: { id },
    include: {
      enrollments: {
        orderBy: { enrollmentDate: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              department: true,
            },
          },
        },
      },
    },
  })
}

export default async function TrainingDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await Promise.resolve(params)
  const program = await getTrainingProgram(resolvedParams.id)
  if (!program) {
    notFound()
  }

  const canManage = session.user.role === 'HR' || session.user.role === 'BOARD'
  const canEnroll =
    (session.user.role === 'EMPLOYEE' || session.user.role === 'MANAGER') && Boolean(session.user.employeeId)
  const alreadyEnrolled = program.enrollments.some(
    (enrollment) => enrollment.employeeId === session.user.employeeId
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/training">
            <Button variant="outline" size="sm">
              Quay lại
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{program.title}</h1>
            <p className="text-gray-600 mt-1">{program.category || 'Chương trình đào tạo'}</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full ${
            program.status === 'ONGOING'
              ? 'bg-green-100 text-green-800'
              : program.status === 'COMPLETED'
              ? 'bg-blue-100 text-blue-800'
              : program.status === 'CANCELLED'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {program.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Giới thiệu chương trình</h2>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">{program.description}</p>
          </div>

          {canEnroll && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Đăng ký tham gia</h3>
              <EnrollButton programId={program.id} alreadyEnrolled={alreadyEnrolled} />
            </div>
          )}

          {canManage && program.enrollments.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Học viên ({program.enrollments.length})
              </h3>
              <div className="space-y-3">
                {program.enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="p-3 border border-gray-200 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {enrollment.employee?.firstName} {enrollment.employee?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {enrollment.employee?.employeeId} • {enrollment.employee?.department || 'N/A'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(enrollment.enrollmentDate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin chương trình</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Danh mục
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{program.category || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Thời lượng
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{program.duration || 0} giờ</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Số người tham gia
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{program.enrollments.length}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Thời gian
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {program.startDate ? formatDate(program.startDate) : '—'} đến{' '}
                  {program.endDate ? formatDate(program.endDate) : '—'}
                </dd>
              </div>
              {program.cost && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Chi phí</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatCurrency(program.cost)}</dd>
                </div>
              )}
              {program.provider && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Đơn vị đào tạo</dt>
                  <dd className="mt-1 text-sm text-gray-900">{program.provider}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}








