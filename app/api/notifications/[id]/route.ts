import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const { isRead } = body

    const notification = await prisma.notification.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Check permission - users can only update their own notifications
    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: resolvedParams.id },
      data: {
        isRead: isRead !== undefined ? isRead : notification.isRead,
      },
    })

    return NextResponse.json(updatedNotification)
  } catch (error) {
    console.error('Error updating notification:', error)
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
    const notification = await prisma.notification.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Check permission - users can only delete their own notifications
    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.notification.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






