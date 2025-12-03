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
    const insuranceType = searchParams.get('insuranceType')
    const status = searchParams.get('status')

    const where: any = {}
    
    if (session.user.role === 'EMPLOYEE' && session.user.employeeId) {
      where.employeeId = session.user.employeeId
    } else if (employeeId) {
      where.employeeId = employeeId
    }
    
    if (insuranceType) {
      where.insuranceType = insuranceType
    }
    
    if (status) {
      where.status = status
    }

    const insurances = await prisma.insurance.findMany({
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

    return NextResponse.json(insurances)
  } catch (error) {
    console.error('Error fetching insurance records:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
      insuranceType,
      policyNumber,
      provider,
      startDate,
      endDate,
      premium,
      coverage,
      notes,
    } = body

    if (!employeeId || !insuranceType || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId, insuranceType, startDate' },
        { status: 400 }
      )
    }

    const insurance = await prisma.insurance.create({
      data: {
        employeeId,
        insuranceType,
        policyNumber,
        provider,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        premium: premium ? parseFloat(premium) : null,
        coverage,
        status: 'ACTIVE',
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

    return NextResponse.json(insurance, { status: 201 })
  } catch (error) {
    console.error('Error creating insurance record:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






