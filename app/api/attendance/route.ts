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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    const where: any = {}
    if (status) {
      where.status = status
    }
    
    // Nếu là EMPLOYEE, HR, hoặc MANAGER, chỉ hiển thị chấm công của chính họ
    if ((session.user.role === 'EMPLOYEE' || session.user.role === 'HR' || session.user.role === 'MANAGER') && session.user.employeeId) {
      where.employeeId = session.user.employeeId
    } else if (session.user.role === 'BOARD' && employeeId) {
      // Chỉ BOARD có thể xem chấm công của bất kỳ nhân viên nào
      where.employeeId = employeeId
    }
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    let attendances = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    // Filter by search query if provided
    if (search) {
      const searchLower = search.toLowerCase()
      attendances = attendances.filter(attendance =>
        attendance.employee.firstName.toLowerCase().includes(searchLower) ||
        attendance.employee.lastName.toLowerCase().includes(searchLower) ||
        attendance.employee.employeeId.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json(attendances)
  } catch (error) {
    console.error('Error fetching attendance:', error)
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
    const checkInDate = new Date(body.checkIn || body.date)
    const checkInTime = checkInDate.getHours() * 60 + checkInDate.getMinutes() // Tổng số phút từ 0h
    const lateThreshold = 9 * 60 // 9h sáng = 540 phút

    // Tự động xác định status: sau 9h sáng = LATE, trước 9h sáng = PRESENT
    let status = 'PRESENT'
    if (checkInTime > lateThreshold) {
      status = 'LATE'
    }

    // Đảm bảo date chỉ chứa ngày (không có giờ)
    const dateOnly = new Date(checkInDate)
    dateOnly.setHours(0, 0, 0, 0)

    const attendance = await prisma.attendance.create({
      data: {
        employeeId: session.user.employeeId,
        date: dateOnly,
        checkIn: checkInDate,
        status: status as any,
        notes: body.notes || null,
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

    return NextResponse.json(attendance, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Bạn đã chấm công cho ngày này rồi' },
        { status: 400 }
      )
    }
    console.error('Error creating attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


