import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Check, X } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import { LeaveActions } from '@/components/leave/LeaveActions'

function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

async function getLeave(id: string, userId: string, role: string, employeeId?: string) {
  // Validate ObjectID format
  if (!isValidObjectId(id)) {
    return null
  }
  
  const leave = await prisma.leave.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeId: true,
          department: true,
          position: true,
        },
      },
    },
  })

  if (!leave) {
    return null
  }

  // EMPLOYEE, HR, và MANAGER chỉ có thể xem đơn nghỉ phép của chính họ
  if ((role === 'EMPLOYEE' || role === 'HR' || role === 'MANAGER') && leave.employeeId !== employeeId) {
    return null
  }

  return leave
}

export default async function LeaveDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await Promise.resolve(params)
  const leave = await getLeave(
    resolvedParams.id,
    session.user.id,
    session.user.role,
    session.user.employeeId
  )

  if (!leave) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Không tìm thấy đơn nghỉ phép hoặc bạn không có quyền xem.
        </div>
        <Link href="/leave">
          <Button variant="outline">Quay lại</Button>
        </Link>
      </div>
    )
  }

  const canApprove = (session.user.role === 'BOARD' || 
                     session.user.role === 'MANAGER') && 
                     leave.status === 'PENDING'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/leave">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chi tiết đơn nghỉ phép</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin đơn nghỉ phép</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nhân viên</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {leave.employee.firstName} {leave.employee.lastName} ({leave.employee.employeeId})
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phòng ban</dt>
                <dd className="mt-1 text-sm text-gray-900">{leave.employee.department || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Loại nghỉ phép</dt>
                <dd className="mt-1 text-sm text-gray-900">{leave.type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Từ ngày</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(leave.startDate)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Đến ngày</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(leave.endDate)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Số ngày</dt>
                <dd className="mt-1 text-sm text-gray-900 font-semibold">{leave.days} ngày</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Lý do</dt>
                <dd className="mt-1 text-sm text-gray-900">{leave.reason || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Trạng thái</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      leave.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : leave.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {leave.status}
                  </span>
                </dd>
              </div>
              {leave.approvedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ngày duyệt</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDateTime(leave.approvedAt)}</dd>
                </div>
              )}
              {leave.rejectionReason && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lý do từ chối</dt>
                  <dd className="mt-1 text-sm text-red-600">{leave.rejectionReason}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          {canApprove && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác</h3>
              <LeaveActions leaveId={leave.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

