import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// API công khai để guest xem job postings (chỉ hiển thị OPEN)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const department = searchParams.get('department') || ''

    const where: any = {
      status: 'OPEN', // Chỉ hiển thị job đang mở
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (department) {
      where.department = { contains: department, mode: 'insensitive' }
    }

    const jobs = await prisma.jobPosting.findMany({
      where,
      select: {
        id: true,
        title: true,
        department: true,
        description: true,
        requirements: true,
        location: true,
        employmentType: true,
        salaryRange: true,
        postedDate: true,
        closingDate: true,
      },
      orderBy: { postedDate: 'desc' },
    })

    return NextResponse.json(jobs || [])
  } catch (error: any) {
    console.error('Error fetching public jobs:', error)
    
    // Kiểm tra nếu là lỗi kết nối database
    if (error.code === 'P2010' || error.message?.includes('Server selection timeout') || error.message?.includes('No available servers')) {
      console.error('Database connection error. Please check:')
      console.error('1. DATABASE_URL in .env file is correct')
      console.error('2. MongoDB Atlas cluster is running')
      console.error('3. Network connection is stable')
      console.error('4. IP address is whitelisted in MongoDB Atlas')
      
      // Trả về empty array thay vì lỗi để trang vẫn load được
      return NextResponse.json([], { status: 200 })
    }
    
    // Các lỗi khác
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}



