import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}
    
    // Nếu là EMPLOYEE, chỉ hiển thị hợp đồng của chính họ
    if (session.user.role === 'EMPLOYEE') {
      if (!session.user.id) {
        console.error('[Contracts API] No user ID in session')
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
      }

      try {
        // Luôn tìm employee qua userId để đảm bảo chính xác
        const employee = await prisma.employee.findUnique({
          where: { userId: session.user.id },
          select: { id: true, employeeId: true },
        })
        
        if (!employee) {
          console.log(`[Contracts API] Employee not found for user ${session.user.id}`)
          return NextResponse.json([])
        }
        
        where.employeeId = employee.id
      } catch (dbError) {
        console.error('[Contracts API] Database error finding employee:', dbError)
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        )
      }
    } else if (employeeId) {
      // HR/BOARD có thể xem hợp đồng của bất kỳ nhân viên nào
      where.employeeId = employeeId
    }
    
    if (status) {
      where.status = status
    }

    // Check for expiring contracts (within 30 days)
    const expiringSoon = searchParams.get('expiringSoon') === 'true'
    if (expiringSoon) {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      where.endDate = {
        lte: thirtyDaysFromNow,
        gte: new Date(),
      }
      where.isIndefinite = false
      where.status = 'ACTIVE'
    }

    try {
      let contracts = await prisma.laborContract.findMany({
        where,
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              employeeId: true,
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { startDate: 'desc' },
      })

      // Filter by search query if provided
      if (search) {
        const searchLower = search.toLowerCase()
        contracts = contracts.filter(contract => 
          contract.contractNumber.toLowerCase().includes(searchLower) ||
          contract.employee.firstName.toLowerCase().includes(searchLower) ||
          contract.employee.lastName.toLowerCase().includes(searchLower) ||
          contract.employee.employeeId.toLowerCase().includes(searchLower) ||
          (contract.employee.user?.email && contract.employee.user.email.toLowerCase().includes(searchLower)) ||
          contract.contractType.toLowerCase().includes(searchLower)
        )
      }

      return NextResponse.json(contracts)
    } catch (dbError) {
      console.error('[Contracts API] Database error fetching contracts:', dbError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[Contracts API] Unexpected error:', error)
    console.error('[Contracts API] Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'HR' && session.user.role !== 'BOARD')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      employeeId,
      contractNumber,
      contractType,
      startDate,
      endDate,
      isIndefinite,
      salary,
      position,
      department,
      document,
      notes,
    } = body

    if (!employeeId || !contractNumber || !contractType || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const contract = await prisma.laborContract.create({
      data: {
        employeeId,
        contractNumber,
        contractType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isIndefinite: isIndefinite || false,
        salary: salary ? parseFloat(salary) : null,
        position,
        department,
        document,
        notes,
        status: 'ACTIVE',
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // Check if the newly created contract is expiring soon and notify
    if (!isIndefinite && endDate && contract.employee.user) {
      const contractEndDate = new Date(endDate)
      const now = new Date()
      const daysUntilExpiry = Math.ceil(
        (contractEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      // If contract expires within 30 days, create notification immediately
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        try {
          const endDateFormatted = contractEndDate.toLocaleDateString('vi-VN')
          
          // Gửi thông báo cho nhân viên
          await prisma.notification.create({
            data: {
              userId: contract.employee.user.id,
              title: 'Hợp đồng sắp hết hạn',
              message: `Hợp đồng ${contractNumber} của bạn sẽ hết hạn sau ${daysUntilExpiry} ngày (${endDateFormatted}). Vui lòng liên hệ phòng HR để gia hạn hoặc ký hợp đồng mới.`,
              type: 'CONTRACT_EXPIRY',
              link: `/contracts`,
            },
          })

          // Gửi thông báo cho HR và BOARD (admin)
          const hrBoardUsers = await prisma.user.findMany({
            where: {
              role: {
                in: ['HR', 'BOARD'], // BOARD = admin
              },
            },
            select: {
              id: true,
            },
          })

          for (const hrBoardUser of hrBoardUsers) {
            await prisma.notification.create({
              data: {
                userId: hrBoardUser.id,
                title: 'Hợp đồng sắp hết hạn',
                message: `Hợp đồng ${contractNumber} của nhân viên ${contract.employee.firstName} ${contract.employee.lastName} (${contract.employee.employeeId}) sẽ hết hạn sau ${daysUntilExpiry} ngày (${endDateFormatted}). Vui lòng liên hệ nhân viên để gia hạn hoặc ký hợp đồng mới.`,
                type: 'CONTRACT_EXPIRY',
                link: `/contracts`,
              },
            })
          }
        } catch (notificationError) {
          console.error('Error creating notification for new contract:', notificationError)
          // Don't fail the contract creation if notification fails
        }
      }
    }

    // Trigger background check for all expiring contracts (non-blocking)
    // Use setTimeout to make it truly non-blocking
    setTimeout(async () => {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        await fetch(`${baseUrl}/api/contracts/check-expiring`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ daysBeforeExpiry: 30 }),
        })
      } catch (err) {
        console.error('Background contract expiry check failed:', err)
        // Silent fail - this is a background task
      }
    }, 0)

    return NextResponse.json(contract, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Contract number already exists' },
        { status: 400 }
      )
    }
    console.error('Error creating contract:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



