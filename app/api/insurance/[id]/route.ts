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
    const insurance = await prisma.insurance.findUnique({
      where: { id: resolvedParams.id },
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
    })

    if (!insurance) {
      return NextResponse.json({ error: 'Insurance record not found' }, { status: 404 })
    }

    // Check access permission
    if (session.user.role === 'EMPLOYEE' && insurance.employeeId !== session.user.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(insurance)
  } catch (error) {
    console.error('Error fetching insurance:', error)
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
      insuranceType,
      policyNumber,
      provider,
      startDate,
      endDate,
      premium,
      coverage,
      status,
      notes,
    } = body

    const insurance = await prisma.insurance.update({
      where: { id: resolvedParams.id },
      data: {
        ...(insuranceType && { insuranceType }),
        ...(policyNumber && { policyNumber }),
        ...(provider && { provider }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(premium !== undefined && { premium: premium ? parseFloat(premium) : null }),
        ...(coverage && { coverage }),
        ...(status && { status }),
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

    return NextResponse.json(insurance)
  } catch (error) {
    console.error('Error updating insurance:', error)
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
    await prisma.insurance.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: 'Insurance record deleted successfully' })
  } catch (error) {
    console.error('Error deleting insurance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






