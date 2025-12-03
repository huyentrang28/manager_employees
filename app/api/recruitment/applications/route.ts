import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// API công khai để guest apply vào job (không cần đăng nhập)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      jobPostingId,
      firstName,
      lastName,
      email,
      phone,
      resume,
      coverLetter,
    } = body

    // Validate required fields
    if (!jobPostingId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: jobPostingId, firstName, lastName, email' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if job posting exists and is OPEN
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
    })

    if (!jobPosting) {
      return NextResponse.json(
        { error: 'Job posting not found' },
        { status: 404 }
      )
    }

    if (jobPosting.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'This job posting is no longer accepting applications' },
        { status: 400 }
      )
    }

    // Check if closing date has passed
    if (jobPosting.closingDate && new Date(jobPosting.closingDate) < new Date()) {
      return NextResponse.json(
        { error: 'The application deadline for this job has passed' },
        { status: 400 }
      )
    }

    // Create application
    const application = await prisma.jobApplication.create({
      data: {
        jobPostingId,
        firstName,
        lastName,
        email,
        phone: phone || null,
        resume: resume || null,
        coverLetter: coverLetter || null,
        status: 'PENDING',
      },
      include: {
        jobPosting: {
          select: {
            title: true,
            department: true,
          },
        },
      },
    })

    // Tạo thông báo cho HR và BOARD về đơn ứng tuyển mới
    try {
      const hrBoardUsers = await prisma.user.findMany({
        where: {
          role: {
            in: ['HR', 'BOARD'],
          },
        },
        select: {
          id: true,
        },
      })

      const notificationPromises = hrBoardUsers.map((user) =>
        prisma.notification.create({
          data: {
            userId: user.id,
            title: 'Đơn ứng tuyển mới',
            message: `${firstName} ${lastName} đã ứng tuyển cho vị trí "${application.jobPosting.title}" (${application.jobPosting.department}). Email: ${email}`,
            type: 'JOB_APPLICATION',
            link: `/recruitment/${jobPostingId}`,
          },
        })
      )

      await Promise.all(notificationPromises)
      console.log(`✅ Created ${hrBoardUsers.length} notifications for new job application`)
    } catch (notificationError) {
      // Không fail nếu tạo notification lỗi, chỉ log
      console.error('Error creating notifications for new application:', notificationError)
    }

    return NextResponse.json(application, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'You have already applied for this position' },
        { status: 400 }
      )
    }
    console.error('Error creating job application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// API để xem danh sách applications (cần đăng nhập và quyền HR/BOARD)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'HR' && session.user.role !== 'BOARD')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const jobPostingId = searchParams.get('jobPostingId')
    const status = searchParams.get('status')

    const where: any = {}
    if (jobPostingId) {
      where.jobPostingId = jobPostingId
    }
    if (status) {
      where.status = status
    }

    const applications = await prisma.jobApplication.findMany({
      where,
      include: {
        jobPosting: {
          select: {
            title: true,
            department: true,
          },
        },
      },
      orderBy: { appliedDate: 'desc' },
    })

    return NextResponse.json(applications)
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


