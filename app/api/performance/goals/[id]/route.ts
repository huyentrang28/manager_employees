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
    const goal = await prisma.performanceGoal.findUnique({
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

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    // Check access permission
    if (session.user.role === 'EMPLOYEE' && goal.employeeId !== session.user.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Error fetching goal:', error)
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
    const goal = await prisma.performanceGoal.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    // Check permission
    const canEdit = 
      session.user.role === 'HR' || 
      session.user.role === 'BOARD' ||
      session.user.role === 'MANAGER' ||
      (session.user.role === 'EMPLOYEE' && goal.employeeId === session.user.employeeId)

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      targetValue,
      currentValue,
      unit,
      startDate,
      endDate,
      status,
      progress,
      notes,
    } = body

    // Calculate progress if currentValue and targetValue are provided
    let calculatedProgress = progress
    if (currentValue !== undefined && targetValue !== undefined && targetValue > 0) {
      calculatedProgress = Math.min(100, Math.max(0, (currentValue / targetValue) * 100))
    }

    // Update status based on progress
    let updatedStatus = status || goal.status
    if (calculatedProgress !== undefined) {
      if (calculatedProgress >= 100) {
        updatedStatus = 'COMPLETED'
      } else if (calculatedProgress > 0) {
        updatedStatus = 'IN_PROGRESS'
      }
    }

    const updateData: any = {}
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (targetValue !== undefined) updateData.targetValue = targetValue ? parseFloat(targetValue) : null
    if (currentValue !== undefined) updateData.currentValue = parseFloat(currentValue)
    if (unit) updateData.unit = unit
    if (startDate) updateData.startDate = new Date(startDate)
    if (endDate) updateData.endDate = new Date(endDate)
    if (updatedStatus) updateData.status = updatedStatus
    if (calculatedProgress !== undefined) updateData.progress = calculatedProgress
    if (notes !== undefined) updateData.notes = notes

    const updatedGoal = await prisma.performanceGoal.update({
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

    return NextResponse.json(updatedGoal)
  } catch (error) {
    console.error('Error updating goal:', error)
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
    if (!session || (session.user.role !== 'HR' && session.user.role !== 'BOARD' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    await prisma.performanceGoal.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: 'Goal deleted successfully' })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






