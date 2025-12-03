import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * API để admin thêm thưởng cho nhân viên và tự động cập nhật PayrollRecord
 */
export async function POST(request: NextRequest) {
  let employeeId: string | undefined
  let amount: any
  let payPeriod: string | undefined
  let reason: string | undefined
  let title: string | undefined
  
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'HR' && session.user.role !== 'BOARD')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    employeeId = body.employeeId
    amount = body.amount
    payPeriod = body.payPeriod
    reason = body.reason
    title = body.title

    if (!employeeId || !amount || !payPeriod) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId, amount, payPeriod' },
        { status: 400 }
      )
    }

    // Kiểm tra employee có tồn tại không
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        contracts: {
          where: { status: 'ACTIVE' },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Validate amount
    const bonusAmount = parseFloat(amount)
    if (isNaN(bonusAmount) || bonusAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Validate payPeriod format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(payPeriod)) {
      return NextResponse.json(
        { error: 'Invalid payPeriod format. Expected format: YYYY-MM' },
        { status: 400 }
      )
    }

    // Tạo Reward
    let reward
    try {
      reward = await prisma.reward.create({
        data: {
          employeeId,
          title: title || `Thưởng tháng ${payPeriod}`,
          description: reason || '',
          rewardType: 'BONUS',
          amount: bonusAmount,
          payPeriod: payPeriod,
          date: new Date(),
          awardedBy: session.user.id,
          notes: `Thưởng cho tháng ${payPeriod}`,
        },
      })
    } catch (rewardError: any) {
      console.error('Error creating reward:', rewardError)
      // Nếu lỗi do field payPeriod không tồn tại, thử tạo không có payPeriod
      if (rewardError.message?.includes('payPeriod') || rewardError.code === 'P2001') {
        reward = await prisma.reward.create({
          data: {
            employeeId,
            title: title || `Thưởng tháng ${payPeriod}`,
            description: reason || '',
            rewardType: 'BONUS',
            amount: bonusAmount,
            date: new Date(payPeriod + '-01'), // Sử dụng ngày đầu tháng làm date
            awardedBy: session.user.id,
            notes: `Thưởng cho tháng ${payPeriod}`,
          },
        })
      } else {
        throw rewardError
      }
    }

    // Tìm hoặc tạo PayrollRecord cho tháng đó
    let payrollRecord = await prisma.payrollRecord.findUnique({
      where: {
        employeeId_payPeriod: {
          employeeId,
          payPeriod,
        },
      },
    })

    const baseSalary = employee.contracts[0]?.salary || employee.salary || 0

    if (payrollRecord) {
      // Cập nhật PayrollRecord hiện có
      const newBonuses = (payrollRecord.bonuses || 0) + bonusAmount
      const newGrossPay = payrollRecord.baseSalary + payrollRecord.allowances + payrollRecord.overtime + newBonuses
      const newNetPay = newGrossPay - payrollRecord.deductions - payrollRecord.tax

      payrollRecord = await prisma.payrollRecord.update({
        where: { id: payrollRecord.id },
        data: {
          bonuses: newBonuses,
          grossPay: newGrossPay,
          netPay: newNetPay,
        },
      })
    } else {
      // Tạo PayrollRecord mới
      const bonuses = bonusAmount
      const grossPay = baseSalary + bonuses
      const netPay = grossPay // Chưa có deductions và tax

      payrollRecord = await prisma.payrollRecord.create({
        data: {
          employeeId,
          payPeriod,
          baseSalary,
          allowances: 0,
          deductions: 0,
          overtime: 0,
          bonuses,
          grossPay,
          netPay,
          tax: 0,
          paymentDate: new Date(),
          status: 'PENDING',
          notes: `Tự động tạo khi thêm thưởng`,
        },
      })
    }

    return NextResponse.json({
      reward,
      payrollRecord,
      message: 'Thưởng đã được thêm và cập nhật vào lương tháng',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error adding bonus:', error)
    console.error('Error stack:', error.stack)
    if (employeeId || amount || payPeriod) {
      console.error('Request body:', { employeeId, amount, payPeriod, reason, title })
    }
    
    // Kiểm tra các lỗi cụ thể
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Reward already exists for this period' },
        { status: 400 }
      )
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid employee ID' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

