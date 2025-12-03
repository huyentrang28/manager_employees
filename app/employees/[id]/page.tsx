import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { EmployeeTabs } from '@/components/employees/EmployeeTabs'

function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

async function getEmployee(id: string) {
  // Validate ObjectID format
  if (!isValidObjectId(id)) {
    return null
  }
  
  return await prisma.employee.findUnique({
    where: { id },
    include: {
      user: {
        select: { email: true, role: true },
      },
      manager: {
        select: {
          firstName: true,
          lastName: true,
          employeeId: true,
          position: true,
        },
      },
      subordinates: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
          position: true,
          department: true,
        },
      },
    },
  })
}

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  // Chỉ HR và BOARD mới được xem chi tiết nhân viên
  if (session.user.role !== 'HR' && session.user.role !== 'BOARD') {
    redirect('/employees')
  }

  const resolvedParams = await Promise.resolve(params)
  const employee = await getEmployee(resolvedParams.id)

  if (!employee) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Không tìm thấy nhân viên.
        </div>
        <Link href="/employees">
          <Button variant="outline">Quay lại</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/employees">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-gray-600 mt-1">Mã NV: {employee.employeeId}</p>
          </div>
        </div>
        {(session.user.role === 'HR' || session.user.role === 'BOARD') && (
          <Link href={`/employees/${employee.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cá nhân</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Họ và tên</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {employee.firstName} {employee.middleName} {employee.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Ngày sinh</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {employee.dateOfBirth ? formatDate(employee.dateOfBirth) : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Giới tính</dt>
                <dd className="mt-1 text-sm text-gray-900">{employee.gender || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {employee.user?.email || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Số điện thoại</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {employee.phone || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Địa chỉ</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {employee.address || '-'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin công việc</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Phòng ban</dt>
                <dd className="mt-1 text-sm text-gray-900">{employee.department || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Chức vụ</dt>
                <dd className="mt-1 text-sm text-gray-900">{employee.position || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Ngày vào làm</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(employee.hireDate)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Trạng thái</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      employee.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : employee.status === 'ON_LEAVE'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {employee.status}
                  </span>
                </dd>
              </div>
              {employee.salary && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lương cơ bản</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-semibold">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(Number(employee.salary))}
                  </dd>
                </div>
              )}
              {employee.manager && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Quản lý trực tiếp</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {employee.manager.firstName} {employee.manager.lastName}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {employee.subordinates.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Nhân viên quản lý ({employee.subordinates.length})
              </h2>
              <div className="space-y-2">
                {employee.subordinates.map((sub) => (
                  <div
                    key={sub.id}
                    className="block p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="font-medium text-gray-900">
                      {sub.firstName} {sub.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {sub.employeeId} • {sub.position} • {sub.department}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin liên hệ khẩn cấp</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Người liên hệ</dt>
                <dd className="mt-1 text-sm text-gray-900">{employee.emergencyContact || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Số điện thoại</dt>
                <dd className="mt-1 text-sm text-gray-900">{employee.emergencyPhone || '-'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <EmployeeTabs employeeId={employee.id} />
      </div>
    </div>
  )
}

