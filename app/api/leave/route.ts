import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const type = searchParams.get('type')

    const where: any = {}
    if (type) {
      where.type = type
    }
    
    // Nếu là EMPLOYEE, HR, hoặc MANAGER, chỉ hiển thị đơn nghỉ phép của chính họ
    if ((session.user.role === 'EMPLOYEE' || session.user.role === 'HR' || session.user.role === 'MANAGER') && session.user.employeeId) {
      where.employeeId = session.user.employeeId
    } else if (session.user.role === 'BOARD' && employeeId) {
      // Chỉ BOARD có thể xem đơn nghỉ phép của bất kỳ nhân viên nào
      where.employeeId = employeeId
    }
    
    if (status) {
      where.status = status
    }

    let leaves = await prisma.leave.findMany({
      where,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter by search query if provided
    if (search) {
      const searchLower = search.toLowerCase()
      leaves = leaves.filter(leave =>
        leave.employee.firstName.toLowerCase().includes(searchLower) ||
        leave.employee.lastName.toLowerCase().includes(searchLower) ||
        leave.employee.employeeId.toLowerCase().includes(searchLower) ||
        (leave.employee.department && leave.employee.department.toLowerCase().includes(searchLower))
      )
    }

    return NextResponse.json(leaves)
  } catch (error) {
    console.error('Error fetching leaves:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user.employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const leave = await prisma.leave.create({
      data: {
        ...body,
        employeeId: session.user.employeeId,
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

    return NextResponse.json(leave, { status: 201 })
  } catch (error) {
    console.error('Error creating leave:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}





