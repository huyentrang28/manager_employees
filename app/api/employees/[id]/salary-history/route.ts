import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * API để lấy lịch sử lương theo tháng từ ngày bắt đầu hợp đồng đến hiện tại
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    // Chỉ HR, BOARD hoặc chính nhân viên đó mới được xem
    if (session.user.role === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      if (!employee || employee.id !== resolvedParams.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (session.user.role !== 'HR' && session.user.role !== 'BOARD') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Lấy thông tin nhân viên và hợp đồng
    const employee = await prisma.employee.findUnique({
      where: { id: resolvedParams.id },
      include: {
        contracts: {
          where: {
            status: 'ACTIVE',
          },
          orderBy: {
            startDate: 'desc',
          },
          take: 1, // Lấy hợp đồng mới nhất
        },
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Lấy tất cả payroll records
    const payrollRecords = await prisma.payrollRecord.findMany({
      where: {
        employeeId: resolvedParams.id,
      },
      orderBy: {
        payPeriod: 'desc',
      },
    })

    // Lấy tất cả thưởng
    const rewards = await prisma.reward.findMany({
      where: {
        employeeId: resolvedParams.id,
        rewardType: 'BONUS',
      },
    })

    // Tạo map để dễ tìm payroll record theo payPeriod
    const payrollMap = new Map()
    payrollRecords.forEach((record) => {
      payrollMap.set(record.payPeriod, record)
    })

    // Tạo map thưởng theo payPeriod
    const rewardMap = new Map()
    rewards.forEach((reward) => {
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

    // Lấy hợp đồng mới nhất để xác định ngày bắt đầu
    const activeContract = employee.contracts[0]
    if (!activeContract) {
      return NextResponse.json({
        employee: {
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          employeeId: employee.employeeId,
        },
        salaryHistory: [],
        message: 'Nhân viên chưa có hợp đồng nào',
      })
    }

    const contractStartDate = new Date(activeContract.startDate)
    const now = new Date()
    const salaryHistory = []

    // Tạo danh sách các tháng từ ngày bắt đầu hợp đồng đến hiện tại
    let currentDate = new Date(contractStartDate.getFullYear(), contractStartDate.getMonth(), 1)
    
    while (currentDate <= now) {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const payPeriod = `${year}-${String(month).padStart(2, '0')}`
      
      // Kiểm tra xem có payroll record cho tháng này không
      const payrollRecord = payrollMap.get(payPeriod)
      
      // Lấy lương cơ bản từ hợp đồng (ưu tiên lương trong hợp đồng, nếu không có thì lấy từ employee)
      const baseSalary = activeContract.salary || employee.salary || 0
      
      // Lấy thưởng cho tháng này
      const bonusAmount = rewardMap.get(payPeriod) || 0

      // Nếu có payroll record, sử dụng dữ liệu từ đó
      // Nếu không có, tính toán dựa trên lương cơ bản + thưởng
      if (payrollRecord) {
        // Có payroll record - sử dụng dữ liệu thực tế (đã bao gồm thưởng)
        const monthData = {
          payPeriod,
          year,
          month,
          monthName: currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
          baseSalary: payrollRecord.baseSalary,
          allowances: payrollRecord.allowances,
          deductions: payrollRecord.deductions,
          overtime: payrollRecord.overtime,
          bonuses: payrollRecord.bonuses,
          tax: payrollRecord.tax,
          grossPay: payrollRecord.grossPay,
          netPay: payrollRecord.netPay,
          paymentDate: payrollRecord.paymentDate,
          status: payrollRecord.status,
          hasRecord: true,
        }
        salaryHistory.push(monthData)
      } else {
        // Không có payroll record - tính từ lương cơ bản + thưởng
        const bonuses = bonusAmount
        const grossPay = baseSalary + bonuses
        const netPay = grossPay

        const monthData = {
          payPeriod,
          year,
          month,
          monthName: currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
          baseSalary: baseSalary,
          allowances: 0,
          deductions: 0,
          overtime: 0,
          bonuses,
          tax: 0,
          grossPay,
          netPay,
          paymentDate: null,
          status: 'PENDING',
          hasRecord: false,
        }
        salaryHistory.push(monthData)
      }
      
      // Chuyển sang tháng tiếp theo
      currentDate.setMonth(currentDate.getMonth() + 1)
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
        contractNumber: activeContract.contractNumber,
        startDate: activeContract.startDate,
        salary: activeContract.salary || employee.salary,
      },
      salaryHistory,
      totalMonths: salaryHistory.length,
    })
  } catch (error) {
    console.error('Error fetching salary history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

