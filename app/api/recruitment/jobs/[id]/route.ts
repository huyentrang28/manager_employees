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
    const job = await prisma.jobPosting.findUnique({
      where: { id: resolvedParams.id },
      include: {
        _count: {
          select: { applications: true },
        },
        applications: {
          take: 10,
          orderBy: { appliedDate: 'desc' },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error fetching job:', error)
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

    const job = await prisma.jobPosting.update({
      where: { id: resolvedParams.id },
      data: body,
    })

    return NextResponse.json(job)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 })
    }
    console.error('Error updating job:', error)
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
    
    await prisma.jobPosting.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: 'Job posting deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 })
    }
    console.error('Error deleting job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



