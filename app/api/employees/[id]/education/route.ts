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

    const educations = await prisma.education.findMany({
      where: { employeeId: resolvedParams.id },
      orderBy: { endDate: 'desc' },
    })

    return NextResponse.json(educations)
  } catch (error) {
    console.error('Error fetching education:', error)
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
    const { degree, field, institution, startDate, endDate, gpa, description, certificate } = body

    if (!degree || !institution) {
      return NextResponse.json(
        { error: 'Missing required fields: degree, institution' },
        { status: 400 }
      )
    }

    const education = await prisma.education.create({
      data: {
        employeeId: resolvedParams.id,
        degree,
        field,
        institution,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        gpa: gpa ? parseFloat(gpa) : null,
        description,
        certificate,
      },
    })

    return NextResponse.json(education, { status: 201 })
  } catch (error) {
    console.error('Error creating education:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






