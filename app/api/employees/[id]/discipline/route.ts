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
    // Check access permission - employees can only see their own discipline records
    if (session.user.role === 'EMPLOYEE' && resolvedParams.id !== session.user.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const disciplines = await prisma.discipline.findMany({
      where: { employeeId: resolvedParams.id },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(disciplines)
  } catch (error) {
    console.error('Error fetching discipline records:', error)
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
    if (!session || (session.user.role !== 'HR' && session.user.role !== 'BOARD' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const body = await request.json()
    const { title, description, violationType, severity, date, actionTaken, notes } = body

    if (!title || !violationType || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields: title, violationType, severity' },
        { status: 400 }
      )
    }

    const discipline = await prisma.discipline.create({
      data: {
        employeeId: resolvedParams.id,
        title,
        description,
        violationType,
        severity,
        date: date ? new Date(date) : new Date(),
        issuedBy: session.user.id,
        actionTaken,
        notes,
      },
    })

    return NextResponse.json(discipline, { status: 201 })
  } catch (error) {
    console.error('Error creating discipline record:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






