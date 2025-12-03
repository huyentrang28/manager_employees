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
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const where: any = {}
    if (category) {
      where.category = category
    }
    if (status) {
      where.status = status
    }

    let programs = await prisma.trainingProgram.findMany({
      where,
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter by search query if provided
    if (search) {
      const searchLower = search.toLowerCase()
      programs = programs.filter(program =>
        program.title.toLowerCase().includes(searchLower) ||
        program.description.toLowerCase().includes(searchLower) ||
        (program.category && program.category.toLowerCase().includes(searchLower)) ||
        (program.provider && program.provider.toLowerCase().includes(searchLower))
      )
    }

    return NextResponse.json(programs)
  } catch (error) {
    console.error('Error fetching training programs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'HR' && session.user.role !== 'BOARD')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const program = await prisma.trainingProgram.create({
      data: body,
    })

    return NextResponse.json(program, { status: 201 })
  } catch (error) {
    console.error('Error creating training program:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}





