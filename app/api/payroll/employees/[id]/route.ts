import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * API để lấy chi tiết lương từng tháng của một nhân viên
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  let employeeId: string | undefined
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle params as Promise or object
    const resolvedParams = await Promise.resolve(params)
    employeeId = resolvedParams?.id

    if (!employeeId || typeof employeeId !== 'string' || employeeId.trim() === '') {
      console.error('Invalid employeeId:', employeeId)
      return NextResponse.json({ error: 'Employee ID is required and must be a valid string' }, { status: 400 })
    }

    employeeId = employeeId.trim()
    console.log('Fetching employee with ID:', employeeId)

    // Nếu là EMPLOYEE, HR, hoặc MANAGER, chỉ cho phép xem lương của chính họ
    if (session.user.role === 'EMPLOYEE' || session.user.role === 'HR' || session.user.role === 'MANAGER') {
      const currentEmployee = await prisma.employee.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      
      if (!currentEmployee || currentEmployee.id !== employeeId) {
        return NextResponse.json({ error: 'Unauthorized - You can only view your own salary' }, { status: 403 })
      }
    } else if (session.user.role !== 'BOARD') {
      // Chỉ BOARD và các role trên mới được phép
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId.trim() },
      include: {
        contracts: {
          where: { status: 'ACTIVE' },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        payrollRecords: {
          orderBy: { payPeriod: 'desc' },
        },
        rewards: {
          where: {
            rewardType: 'BONUS',
          },
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const contract = employee.contracts[0]
    if (!contract) {
      return NextResponse.json({
        employee: {
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          employeeId: employee.employeeId,
        },
        salaryHistory: [],
        message: 'Nhân viên chưa có hợp đồng',
      })
    }

    const baseSalary = contract.salary || employee.salary || 0
    const contractStartDate = new Date(contract.startDate)
    const now = new Date()
    const nowYear = now.getFullYear()
    const nowMonth = now.getMonth() + 1
    const currentPayPeriod = `${nowYear}-${String(nowMonth).padStart(2, '0')}`

    // Tạo map cho PayrollRecord và Reward
    const payrollMap = new Map()
    employee.payrollRecords.forEach((record) => {
      payrollMap.set(record.payPeriod, record)
    })

    const rewardMap = new Map()
    employee.rewards.forEach((reward) => {
      // Lấy payPeriod từ reward.payPeriod hoặc tính từ reward.date
      let payPeriod: string | null = null
      if (reward.payPeriod) {
        payPeriod = reward.payPeriod
      } else if (reward.date) {
        // Tính payPeriod từ date nếu không có payPeriod
        const rewardDate = new Date(reward.date)
        const year = rewardDate.getFullYear()
        const month = rewardDate.getMonth() + 1
        payPeriod = `${year}-${String(month).padStart(2, '0')}`
      }
      
      if (payPeriod) {
        const existing = rewardMap.get(payPeriod) || 0
        rewardMap.set(payPeriod, existing + (reward.amount || 0))
      }
    })

    // Tạo danh sách các tháng từ ngày bắt đầu hợp đồng đến hiện tại
    const salaryHistory = []
    
    // Bắt đầu từ tháng đầu tiên của hợp đồng
    const startYear = contractStartDate.getFullYear()
    const startMonth = contractStartDate.getMonth() + 1
    let currentYear = startYear
    let currentMonth = startMonth
    
    // Kết thúc ở tháng hiện tại
    const endYear = nowYear
    const endMonth = nowMonth

    // Tính toán các tháng từ tháng bắt đầu hợp đồng đến tháng hiện tại
    while (
      currentYear < endYear || 
      (currentYear === endYear && currentMonth <= endMonth)
    ) {
      const payPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
      const isCurrentMonth = payPeriod === currentPayPeriod

      const payrollRecord = payrollMap.get(payPeriod)
      const bonusAmount = rewardMap.get(payPeriod) || 0

      if (payrollRecord) {
        // Có PayrollRecord thực tế
        salaryHistory.push({
          payPeriod,
          year: currentYear,
          month: currentMonth,
          monthName: new Date(currentYear, currentMonth - 1, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
          baseSalary: payrollRecord.baseSalary,
          allowances: payrollRecord.allowances,
          overtime: payrollRecord.overtime,
          bonuses: payrollRecord.bonuses,
          grossPay: payrollRecord.grossPay,
          deductions: payrollRecord.deductions,
          tax: payrollRecord.tax,
          netPay: payrollRecord.netPay,
          status: payrollRecord.status,
          paymentDate: payrollRecord.paymentDate ? new Date(payrollRecord.paymentDate).toISOString() : null,
          hasRecord: true,
        })
      } else {
        // Không có PayrollRecord, tính từ hợp đồng
        const bonuses = bonusAmount
        const grossPay = baseSalary + bonuses
        const netPay = grossPay

        salaryHistory.push({
          payPeriod,
          year: currentYear,
          month: currentMonth,
          monthName: new Date(currentYear, currentMonth - 1, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
          baseSalary,
          allowances: 0,
          overtime: 0,
          bonuses,
          grossPay,
          deductions: 0,
          tax: 0,
          netPay,
          status: isCurrentMonth ? 'PENDING' : 'PAID', // Tháng hiện tại = PENDING, quá khứ = PAID
          paymentDate: isCurrentMonth ? null : new Date(currentYear, currentMonth, 0).toISOString(), // Last day of the month
          hasRecord: false,
        })
      }

      // Chuyển sang tháng tiếp theo
      currentMonth++
      if (currentMonth > 12) {
        currentMonth = 1
        currentYear++
      }
    }

    // Sắp xếp theo thời gian mới nhất trước
    salaryHistory.reverse()

    return NextResponse.json({
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
      },
      contract: {
        contractNumber: contract.contractNumber,
        startDate: contract.startDate,
        salary: baseSalary,
      },
      salaryHistory,
      totalPaid: salaryHistory
        .filter((m) => m.status === 'PAID')
        .reduce((sum, m) => sum + m.netPay, 0),
      totalPending: salaryHistory
        .filter((m) => m.status === 'PENDING')
        .reduce((sum, m) => sum + m.netPay, 0),
    })
  } catch (error: any) {
    console.error('Error fetching employee salary details:', error)
    console.error('Error stack:', error.stack)
    console.error('Employee ID attempted:', employeeId)
    
    // Handle Prisma-specific errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }
    
    if (error.code === 'P2003' || error.code === 'P2011') {
      return NextResponse.json(
        { error: 'Invalid employee ID format' },
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

