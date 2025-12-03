import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// API đăng ký công khai cho guest (không cần đăng nhập)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName } = body

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin: email, mật khẩu, họ và tên' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Định dạng email không hợp lệ' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email này đã được sử dụng' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Phân biệt role dựa trên email domain
    // @hrms.com = nhân viên công ty (EMPLOYEE)
    // Các domain khác = người dùng bình thường (GUEST)
    const emailDomain = email.split('@')[1]?.toLowerCase()
    const userRole = emailDomain === 'hrms.com' ? 'EMPLOYEE' : 'GUEST'

    // Create user với role tương ứng
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: userRole as any,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email này đã được sử dụng' },
        { status: 400 }
      )
    }
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ' },
        { status: 400 }
      )
    }
    
    // Handle database connection errors
    if (error.code === 'P1001' || error.message?.includes('connect')) {
      return NextResponse.json(
        { error: 'Không thể kết nối đến database. Vui lòng kiểm tra cấu hình.' },
        { status: 503 }
      )
    }
    
    console.error('Error registering user:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}


