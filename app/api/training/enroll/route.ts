import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Tìm employee qua userId
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee record not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { trainingProgramId } = body

    if (!trainingProgramId) {
      return NextResponse.json(
        { error: 'Training program ID is required' },
        { status: 400 }
      )
    }

    // Kiểm tra xem chương trình có tồn tại không
    const program = await prisma.trainingProgram.findUnique({
      where: { id: trainingProgramId },
    })

    if (!program) {
      return NextResponse.json(
        { error: 'Training program not found' },
        { status: 404 }
      )
    }

    const enrollment = await prisma.trainingEnrollment.create({
      data: {
        employeeId: employee.id, // Sử dụng ObjectId
        trainingProgramId,
      },
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
    })

    return NextResponse.json(enrollment, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Already enrolled in this program' },
        { status: 400 }
      )
    }
    console.error('Error enrolling in training:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}





