import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, FileText, Calendar, DollarSign, Building, User, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'

async function getContract(id: string) {
  return await prisma.laborContract.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeId: true,
          phone: true,
          department: true,
          position: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  })
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatCurrency(amount: number | null) {
  if (!amount) return '-'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800'
    case 'EXPIRED':
      return 'bg-red-100 text-red-800'
    case 'TERMINATED':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getContractTypeLabel(type: string) {
  const types: Record<string, string> = {
    PERMANENT: 'Hợp đồng không xác định thời hạn',
    TEMPORARY: 'Hợp đồng có thời hạn',
    PROBATION: 'Hợp đồng thử việc',
    SEASONAL: 'Hợp đồng theo mùa',
    PART_TIME: 'Hợp đồng bán thời gian',
  }
  return types[type] || type
}

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await Promise.resolve(params)
  const contract = await getContract(resolvedParams.id)

  if (!contract) {
    notFound()
  }

  // Check access permission - EMPLOYEE chỉ có thể xem hợp đồng của chính họ
  if (session.user.role === 'EMPLOYEE') {
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!employee || contract.employeeId !== employee.id) {
      notFound()
    }
  }

  const canManage = session.user.role === 'HR' || session.user.role === 'BOARD'
  const isExpiringSoon =
    contract.endDate &&
    !contract.isIndefinite &&
    new Date(contract.endDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
    new Date(contract.endDate) > new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/contracts">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chi tiết hợp đồng lao động</h1>
            <p className="text-gray-600 mt-1">
              {contract.contractNumber} • {contract.employee.firstName} {contract.employee.lastName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(contract.status)}`}>
            {contract.status}
          </span>
          {isExpiringSoon && (
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Sắp hết hạn
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Thông tin hợp đồng
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Số hợp đồng</dt>
                <dd className="mt-1 text-sm text-gray-900 font-medium">{contract.contractNumber}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Loại hợp đồng</dt>
                <dd className="mt-1 text-sm text-gray-900">{getContractTypeLabel(contract.contractType)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Ngày bắt đầu</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(contract.startDate)}
                </dd>
              </div>
              {contract.endDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ngày kết thúc</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(contract.endDate)}
                  </dd>
                </div>
              )}
              {contract.isIndefinite && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Thời hạn</dt>
                  <dd className="mt-1 text-sm text-blue-600 font-medium">Không xác định thời hạn</dd>
                </div>
              )}
              {contract.salary && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lương</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(contract.salary)}
                  </dd>
                </div>
              )}
              {contract.department && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phòng ban</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {contract.department}
                  </dd>
                </div>
              )}
              {contract.position && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Chức vụ</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contract.position}</dd>
                </div>
              )}
              {contract.document && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tài liệu</dt>
                  <dd className="mt-1">
                    <a
                      href={contract.document}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {contract.document}
                    </a>
                  </dd>
                </div>
              )}
              {contract.notes && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ghi chú</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{contract.notes}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Thông tin nhân viên
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Họ và tên</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {contract.employee.firstName} {contract.employee.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Mã nhân viên</dt>
                <dd className="mt-1 text-sm text-gray-900">{contract.employee.employeeId}</dd>
              </div>
              {contract.employee.user?.email && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contract.employee.user.email}</dd>
                </div>
              )}
              {contract.employee.phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Số điện thoại</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contract.employee.phone}</dd>
                </div>
              )}
              {contract.employee.department && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phòng ban</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contract.employee.department}</dd>
                </div>
              )}
              {contract.employee.position && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Chức vụ</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contract.employee.position}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khác</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Ngày tạo</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(contract.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Cập nhật lần cuối</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(contract.updatedAt)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  )
}




