import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword, userId } = body

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Determine which user to update
    const targetUserId = userId || session.user.id

    // Check permission - users can only reset their own password, or HR/BOARD can reset any
    if (targetUserId !== session.user.id && session.user.role !== 'HR' && session.user.role !== 'BOARD') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If resetting own password, verify current password
    if (targetUserId === session.user.id) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required' },
          { status: 400 }
        )
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password)
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        )
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        password: hashedPassword,
      },
    })

    return NextResponse.json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






