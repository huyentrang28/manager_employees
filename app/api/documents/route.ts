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
    const type = searchParams.get('type')

    const where: any = {}
    
    if (session.user.role === 'EMPLOYEE' && session.user.employeeId) {
      where.employeeId = session.user.employeeId
    } else if (employeeId) {
      where.employeeId = employeeId
    }
    
    if (type) {
      where.type = type
    }

    // Check access level based on user role
    if (session.user.role === 'EMPLOYEE') {
      where.accessLevel = { in: ['EMPLOYEE', 'MANAGER', 'HR', 'BOARD'] }
    } else if (session.user.role === 'MANAGER') {
      where.accessLevel = { in: ['MANAGER', 'HR', 'BOARD'] }
    } else if (session.user.role === 'HR') {
      where.accessLevel = { in: ['HR', 'BOARD'] }
    }
    // BOARD can see all

    const documents = await prisma.employeeDocument.findMany({
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
      orderBy: { uploadedAt: 'desc' },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      employeeId,
      name,
      type,
      filePath,
      description,
      accessLevel = 'EMPLOYEE',
    } = body

    if (!employeeId || !name || !type || !filePath) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check permission - employees can only upload their own documents
    if (session.user.role === 'EMPLOYEE' && employeeId !== session.user.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // HR and BOARD can set any access level, others default to EMPLOYEE
    const finalAccessLevel = (session.user.role === 'HR' || session.user.role === 'BOARD')
      ? accessLevel
      : 'EMPLOYEE'

    const document = await prisma.employeeDocument.create({
      data: {
        employeeId,
        name,
        type,
        filePath,
        description,
        accessLevel: finalAccessLevel,
        uploadedBy: session.user.id,
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

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






