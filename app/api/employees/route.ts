import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isHrOrBoard(role?: string) {
  return role === 'HR' || role === 'BOARD'
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || undefined
    const department = searchParams.get('department') || undefined
    const statusParam = searchParams.get('status') || undefined

    // Validate status enum
    const validStatuses = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']
    const status = statusParam && validStatuses.includes(statusParam) 
      ? (statusParam as 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED')
      : undefined

    // Tối ưu: chỉ select những field cần thiết
    const employees = await prisma.employee.findMany({
      where: {
        ...(department ? { department } : {}),
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { employeeId: { contains: search, mode: 'insensitive' } },
                {
                  user: { email: { contains: search, mode: 'insensitive' } },
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        department: true,
        position: true,
        hireDate: true,
        status: true,
        user: {
          select: { email: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Giới hạn số lượng để tăng tốc độ
    })

    return NextResponse.json({ employees })
  } catch (error) {
    console.error('Error fetching employees list:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isHrOrBoard(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      userId,
      employeeId,
      firstName,
      lastName,
      hireDate,
      middleName,
      phone,
      department,
      position,
      salary,
      status = 'ACTIVE',
    } = body

    const missingFields = ['userId', 'employeeId', 'firstName', 'lastName', 'hireDate'].filter(
      (field) => !body[field]
    )

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const parsedHireDate = new Date(hireDate)
    if (Number.isNaN(parsedHireDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid hireDate value' },
        { status: 400 }
      )
    }

    const duplicate = await prisma.employee.findFirst({
      where: {
        OR: [{ employeeId }, { userId }],
      },
    })

    if (duplicate) {
      return NextResponse.json(
        { error: 'Employee with this ID or user already exists' },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.create({
      data: {
        userId,
        employeeId,
        firstName,
        lastName,
        middleName: middleName || null,
        phone: phone || null,
        department: department || null,
        position: position || null,
        hireDate: parsedHireDate,
        salary: typeof salary === 'number' ? salary : salary ? Number(salary) : null,
        status,
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Employee with this information already exists' },
        { status: 400 }
      )
    }

    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


