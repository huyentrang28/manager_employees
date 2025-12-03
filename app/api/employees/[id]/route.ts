import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const employee = await prisma.employee.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: {
          select: { email: true, role: true },
        },
        manager: {
          select: { firstName: true, lastName: true, employeeId: true },
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

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'HR' && session.user.role !== 'BOARD')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const body = await request.json()
    const { userId, ...employeeData } = body

    let hireDateValue = employeeData.hireDate
    if (hireDateValue) {
      const parsed = new Date(hireDateValue)
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Invalid hireDate' }, { status: 400 })
      }
      hireDateValue = parsed
    }

    const employee = await prisma.employee.update({
      where: { id: resolvedParams.id },
      data: {
        ...employeeData,
        hireDate: hireDateValue ?? undefined,
      },
      include: {
        user: {
          select: { email: true, role: true },
        },
      },
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'HR' && session.user.role !== 'BOARD')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    // Xóa nhân viên (cascade sẽ xóa các bản ghi liên quan)
    await prisma.employee.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: 'Employee deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


