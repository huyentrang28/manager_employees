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
    const leave = await prisma.leave.findUnique({
      where: { id: resolvedParams.id },
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
      return NextResponse.json({ error: 'Leave not found' }, { status: 404 })
    }

    // EMPLOYEE, HR, và MANAGER chỉ có thể xem đơn nghỉ phép của chính họ
    if ((session.user.role === 'EMPLOYEE' || session.user.role === 'HR' || session.user.role === 'MANAGER') && leave.employeeId !== session.user.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(leave)
  } catch (error) {
    console.error('Error fetching leave:', error)
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only BOARD and Managers can approve/reject (HR không được duyệt nghỉ phép)
    if (session.user.role !== 'BOARD' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await Promise.resolve(params)
    const body = await request.json()
    const { status, rejectionReason } = body

    if (status === 'APPROVED' || status === 'REJECTED') {
      const leave = await prisma.leave.update({
        where: { id: resolvedParams.id },
        data: {
          status,
          approvedBy: session.user.employeeId || session.user.id,
          approvedAt: new Date(),
          rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              employeeId: true,
            },
          },
        },
      })

      return NextResponse.json(leave)
    }

    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  } catch (error) {
    console.error('Error updating leave:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}





