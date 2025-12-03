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
    const trainingProgramId = searchParams.get('trainingProgramId')
    const employeeId = searchParams.get('employeeId')

    const where: any = {}
    
    if (session.user.role === 'EMPLOYEE' && session.user.employeeId) {
      where.employeeId = session.user.employeeId
    } else if (employeeId) {
      where.employeeId = employeeId
    }
    
    if (trainingProgramId) {
      where.trainingProgramId = trainingProgramId
    }

    const feedbacks = await prisma.trainingFeedback.findMany({
      where,
      include: {
        enrollment: {
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
                employeeId: true,
              },
            },
            trainingProgram: {
              select: {
                title: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    })

    return NextResponse.json(feedbacks)
  } catch (error) {
    console.error('Error fetching training feedback:', error)
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
      enrollmentId,
      rating,
      contentRating,
      instructorRating,
      materialRating,
      feedback,
      suggestions,
      wouldRecommend,
    } = body

    if (!enrollmentId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields: enrollmentId, rating' },
        { status: 400 }
      )
    }

    // Check if enrollment exists and belongs to the user
    const enrollment = await prisma.trainingEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        employee: true,
      },
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Check permission
    if (session.user.role === 'EMPLOYEE' && enrollment.employeeId !== session.user.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.trainingFeedback.findUnique({
      where: { enrollmentId },
    })

    if (existingFeedback) {
      return NextResponse.json(
        { error: 'Feedback already submitted for this enrollment' },
        { status: 400 }
      )
    }

    const trainingFeedback = await prisma.trainingFeedback.create({
      data: {
        enrollmentId,
        employeeId: enrollment.employeeId,
        trainingProgramId: enrollment.trainingProgramId,
        rating: parseInt(rating),
        contentRating: contentRating ? parseInt(contentRating) : null,
        instructorRating: instructorRating ? parseInt(instructorRating) : null,
        materialRating: materialRating ? parseInt(materialRating) : null,
        feedback,
        suggestions,
        wouldRecommend,
      },
      include: {
        enrollment: {
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            trainingProgram: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(trainingFeedback, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Feedback already submitted for this enrollment' },
        { status: 400 }
      )
    }
    console.error('Error creating training feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






