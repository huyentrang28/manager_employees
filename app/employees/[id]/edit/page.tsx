import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/Button'
import { EditEmployeeForm, EditableEmployee } from '@/components/employees/EditEmployeeForm'

function isAllowed(role?: string) {
  return role === 'HR' || role === 'BOARD'
}

function formatDateInput(date: Date) {
  return date.toISOString().split('T')[0]
}

async function loadEmployee(id: string): Promise<EditableEmployee | null> {
  const employee = await prisma.employee.findUnique({
    where: { id },
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
      middleName: true,
      phone: true,
      department: true,
      position: true,
      hireDate: true,
      status: true,
      salary: true,
    },
  })

  if (!employee) {
    return null
  }

  return {
    ...employee,
    hireDate: formatDateInput(employee.hireDate),
  }
}

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await Promise.resolve(params)
  if (!isAllowed(session.user.role)) {
    redirect(`/employees/${resolvedParams.id}`)
  }

  const employee = await loadEmployee(resolvedParams.id)
  if (!employee) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/employees/${employee.id}`}>
          <Button variant="outline" size="sm">
            Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa nhân viên</h1>
          <p className="text-gray-600 mt-2">
            Cập nhật thông tin nhân viên {employee.employeeId}
          </p>
        </div>
      </div>

      <EditEmployeeForm employee={employee} />
    </div>
  )
}








