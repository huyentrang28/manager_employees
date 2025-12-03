import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const { status } = body

    if (!status || !['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ACTIVE, INACTIVE, ON_LEAVE, TERMINATED' },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.update({
      where: { id: resolvedParams.id },
      data: { status: status as any },
      include: {
        user: {
          select: { email: true },
        },
      },
    })

    return NextResponse.json(employee)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }
    console.error('Error updating employee status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



