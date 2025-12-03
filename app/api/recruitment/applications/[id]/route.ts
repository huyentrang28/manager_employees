import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Lấy thông tin một application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'HR' && session.user.role !== 'BOARD')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const application = await prisma.jobApplication.findUnique({
      where: { id: resolvedParams.id },
      include: {
        jobPosting: {
          select: {
            title: true,
            department: true,
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error('Error fetching application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Cập nhật trạng thái application
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
    const { status, interviewDate, interviewLocation, notes, offerDetails } = body

    // Validate status
    const validStatuses = ['PENDING', 'REVIEWING', 'INTERVIEWED', 'OFFERED', 'ACCEPTED', 'REJECTED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Get current application
    const currentApplication = await prisma.jobApplication.findUnique({
      where: { id: resolvedParams.id },
      include: {
        jobPosting: {
          select: {
            title: true,
            department: true,
          },
        },
      },
    })

    if (!currentApplication) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Update application
    const updateData: any = {
      status: status as any,
      notes: notes !== undefined ? notes : currentApplication.notes,
    }

    if (status === 'INTERVIEWED' && interviewDate) {
      updateData.interviewDate = new Date(interviewDate)
    }

    const application = await prisma.jobApplication.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        jobPosting: {
          select: {
            title: true,
            department: true,
          },
        },
      },
    })

    return NextResponse.json(application)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    console.error('Error updating application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

