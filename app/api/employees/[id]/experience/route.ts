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
    // Check access permission
    if (session.user.role === 'EMPLOYEE' && resolvedParams.id !== session.user.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const experiences = await prisma.workExperience.findMany({
      where: { employeeId: resolvedParams.id },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json(experiences)
  } catch (error) {
    console.error('Error fetching work experience:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    // Check permission
    const canEdit = 
      session.user.role === 'HR' || 
      session.user.role === 'BOARD' ||
      (session.user.role === 'EMPLOYEE' && resolvedParams.id === session.user.employeeId)

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { company, position, startDate, endDate, isCurrent, description, achievements } = body

    if (!company || !position || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: company, position, startDate' },
        { status: 400 }
      )
    }

    const experience = await prisma.workExperience.create({
      data: {
        employeeId: resolvedParams.id,
        company,
        position,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: isCurrent || false,
        description,
        achievements,
      },
    })

    return NextResponse.json(experience, { status: 201 })
  } catch (error) {
    console.error('Error creating work experience:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






