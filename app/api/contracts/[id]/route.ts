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
    const contract = await prisma.laborContract.findUnique({
      where: { id: resolvedParams.id },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            phone: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Check access permission - EMPLOYEE chỉ có thể xem hợp đồng của chính họ
    if (session.user.role === 'EMPLOYEE') {
      // Lấy employee record của user hiện tại
      const employee = await prisma.employee.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      
      if (!employee || contract.employeeId !== employee.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error fetching contract:', error)
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
    const {
      contractType,
      startDate,
      endDate,
      isIndefinite,
      salary,
      position,
      department,
      status,
      document,
      notes,
    } = body

    const contract = await prisma.laborContract.update({
      where: { id: resolvedParams.id },
      data: {
        ...(contractType && { contractType }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(isIndefinite !== undefined && { isIndefinite }),
        ...(salary !== undefined && { salary: salary ? parseFloat(salary) : null }),
        ...(position && { position }),
        ...(department && { department }),
        ...(status && { status }),
        ...(document && { document }),
        ...(notes !== undefined && { notes }),
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

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error updating contract:', error)
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
    await prisma.laborContract.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: 'Contract deleted successfully' })
  } catch (error) {
    console.error('Error deleting contract:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



