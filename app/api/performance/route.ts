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
    const search = searchParams.get('search')
    const rating = searchParams.get('rating')

    const where: any = {}
    if (rating) {
      where.overallRating = rating
    }
    
    if (session.user.role === 'EMPLOYEE' && session.user.employeeId) {
      where.employeeId = session.user.employeeId
    } else if (employeeId) {
      where.employeeId = employeeId
    }

    let reviews = await prisma.performanceReview.findMany({
      where,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true,
          },
        },
      },
      orderBy: { reviewDate: 'desc' },
    })

    // Filter by search query if provided
    if (search) {
      const searchLower = search.toLowerCase()
      reviews = reviews.filter(review =>
        review.employee.firstName.toLowerCase().includes(searchLower) ||
        review.employee.lastName.toLowerCase().includes(searchLower) ||
        review.employee.employeeId.toLowerCase().includes(searchLower) ||
        review.reviewPeriod.toLowerCase().includes(searchLower) ||
        (review.employee.department && review.employee.department.toLowerCase().includes(searchLower))
      )
    }

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching performance reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'HR' && session.user.role !== 'BOARD' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const review = await prisma.performanceReview.create({
      data: {
        ...body,
        reviewerId: session.user.employeeId || session.user.id,
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

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Error creating performance review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}





