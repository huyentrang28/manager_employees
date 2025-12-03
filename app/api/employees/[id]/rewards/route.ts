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

    const rewards = await prisma.reward.findMany({
      where: { employeeId: resolvedParams.id },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(rewards)
  } catch (error) {
    console.error('Error fetching rewards:', error)
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
    const { title, description, rewardType, amount, date, notes } = body

    if (!title || !rewardType) {
      return NextResponse.json(
        { error: 'Missing required fields: title, rewardType' },
        { status: 400 }
      )
    }

    const reward = await prisma.reward.create({
      data: {
        employeeId: resolvedParams.id,
        title,
        description,
        rewardType,
        amount: amount ? parseFloat(amount) : null,
        date: date ? new Date(date) : new Date(),
        awardedBy: session.user.id,
        notes,
      },
    })

    return NextResponse.json(reward, { status: 201 })
  } catch (error) {
    console.error('Error creating reward:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






