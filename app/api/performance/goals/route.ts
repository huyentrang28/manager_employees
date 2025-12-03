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

    const where: any = {}
    
    if (session.user.role === 'EMPLOYEE' && session.user.employeeId) {
      where.employeeId = session.user.employeeId
    } else if (employeeId) {
      where.employeeId = employeeId
    }
    
    if (status) {
      where.status = status
    }

    const goals = await prisma.performanceGoal.findMany({
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
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json(goals)
  } catch (error) {
    console.error('Error fetching performance goals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'HR' && session.user.role !== 'BOARD' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      employeeId,
      title,
      description,
      targetValue,
      currentValue,
      unit,
      startDate,
      endDate,
      notes,
    } = body

    if (!employeeId || !title || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId, title, startDate, endDate' },
        { status: 400 }
      )
    }

    const goal = await prisma.performanceGoal.create({
      data: {
        employeeId,
        title,
        description,
        targetValue: targetValue ? parseFloat(targetValue) : null,
        currentValue: currentValue ? parseFloat(currentValue) : 0,
        unit,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'IN_PROGRESS',
        progress: 0,
        assignedBy: session.user.id,
        notes,
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

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error('Error creating performance goal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






