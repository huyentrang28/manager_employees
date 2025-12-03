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
    const document = await prisma.employeeDocument.findUnique({
      where: { id: resolvedParams.id },
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

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check access permission
    if (session.user.role === 'EMPLOYEE' && document.employeeId !== session.user.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check access level
    const accessLevels: Record<string, string[]> = {
      EMPLOYEE: ['EMPLOYEE', 'MANAGER', 'HR', 'BOARD'],
      MANAGER: ['MANAGER', 'HR', 'BOARD'],
      HR: ['HR', 'BOARD'],
      BOARD: ['BOARD'],
    }

    const allowedLevels = accessLevels[document.accessLevel] || []
    if (!allowedLevels.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error fetching document:', error)
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const body = await request.json()
    const { name, description, accessLevel } = body

    const document = await prisma.employeeDocument.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check permission
    if (session.user.role === 'EMPLOYEE' && document.employeeId !== session.user.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only HR and BOARD can change access level
    const updateData: any = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (accessLevel && (session.user.role === 'HR' || session.user.role === 'BOARD')) {
      updateData.accessLevel = accessLevel
    }

    const updatedDocument = await prisma.employeeDocument.update({
      where: { id: resolvedParams.id },
      data: updateData,
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

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error('Error updating document:', error)
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const document = await prisma.employeeDocument.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Only HR, BOARD, or the document owner can delete
    const canDelete = 
      session.user.role === 'HR' || 
      session.user.role === 'BOARD' ||
      (session.user.role === 'EMPLOYEE' && document.employeeId === session.user.employeeId)

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.employeeDocument.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: 'Document deleted successfully' })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






