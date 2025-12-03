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
    const payPeriod = searchParams.get('payPeriod')
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    const where: any = {}
    if (status) {
      where.status = status
    }
    
    // Nếu là EMPLOYEE, HR, hoặc MANAGER, chỉ hiển thị lương của chính họ
    if (session.user.role === 'EMPLOYEE' || session.user.role === 'HR' || session.user.role === 'MANAGER') {
      // Tìm employee qua userId
      const employee = await prisma.employee.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      
      if (!employee) {
        return NextResponse.json([])
      }
      
      where.employeeId = employee.id
    } else if (session.user.role === 'BOARD' && employeeId) {
      // Chỉ BOARD có thể xem lương của bất kỳ nhân viên nào
      where.employeeId = employeeId
    }
    
    if (payPeriod) {
      where.payPeriod = payPeriod
    }

    const records = await prisma.payrollRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
      },
      orderBy: { payPeriod: 'desc' },
    })

    // Nếu không có PayrollRecord, tạo dữ liệu từ hợp đồng
    if (records.length === 0) {
      type EmployeeWithContracts = Awaited<ReturnType<typeof prisma.employee.findMany>>[0] & {
        contracts: Array<{
          id: string
          salary: number | null
          startDate: Date
          endDate: Date | null
          status: string
        }>
      }
      let employeesToProcess: EmployeeWithContracts[] = []
      
      if (session.user.role === 'EMPLOYEE' || session.user.role === 'HR' || session.user.role === 'MANAGER') {
        // EMPLOYEE, HR, MANAGER: chỉ xem của mình
        const employee = await prisma.employee.findUnique({
          where: { userId: session.user.id },
          include: {
            contracts: {
              where: { status: 'ACTIVE' },
              orderBy: { startDate: 'desc' },
              take: 1,
            },
          },
        })
        if (employee) {
          employeesToProcess = [employee]
        }
      } else {
        // BOARD: xem tất cả nhân viên có hợp đồng
        employeesToProcess = await prisma.employee.findMany({
          where: employeeId ? { id: employeeId } : { status: 'ACTIVE' },
          include: {
            contracts: {
              where: { status: 'ACTIVE' },
              orderBy: { startDate: 'desc' },
              take: 1,
            },
          },
        })
      }
      
      // Lấy tất cả thưởng của các nhân viên này
      const employeeIds = employeesToProcess.map(e => e.id)
      const rewards = await prisma.reward.findMany({
        where: {
          employeeId: { in: employeeIds },
          rewardType: 'BONUS',
        },
      })

      // Tạo map thưởng theo employeeId và payPeriod
      const rewardMap = new Map<string, Map<string, number>>()
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
          if (!rewardMap.has(reward.employeeId)) {
            rewardMap.set(reward.employeeId, new Map())
          }
          const employeeRewards = rewardMap.get(reward.employeeId)!
          const existing = employeeRewards.get(payPeriod) || 0
          employeeRewards.set(payPeriod, existing + (reward.amount || 0))
        }
      })

      let monthRecords = []
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      const currentPayPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
      
      for (const employee of employeesToProcess) {
        if (employee.contracts.length > 0) {
          const contract = employee.contracts[0]
          const baseSalary = contract.salary || employee.salary || 0
          
          // Tạo danh sách các tháng từ ngày bắt đầu hợp đồng đến hiện tại
          const contractStartDate = new Date(contract.startDate)
          
          // Bắt đầu từ tháng đầu tiên của hợp đồng
          const startYear = contractStartDate.getFullYear()
          const startMonth = contractStartDate.getMonth() + 1
          let currentYear = startYear
          let currentMonth = startMonth
          
          // Kết thúc ở tháng hiện tại
          const endYear = now.getFullYear()
          const endMonth = now.getMonth() + 1
          
          // Tính toán các tháng từ tháng bắt đầu hợp đồng đến tháng hiện tại
          while (
            currentYear < endYear || 
            (currentYear === endYear && currentMonth <= endMonth)
          ) {
            const payPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
            
            // Lấy thưởng cho tháng này
            const employeeRewards = rewardMap.get(employee.id)
            const bonuses = employeeRewards?.get(payPeriod) || 0
            
            // Phân biệt tháng quá khứ và tháng hiện tại
            // Tháng quá khứ: status = 'PAID' (đã trả lương)
            // Tháng hiện tại: status = 'PENDING' (chưa trả lương)
            const isCurrentMonth = payPeriod === currentPayPeriod
            const status = isCurrentMonth ? 'PENDING' : 'PAID'
            
            // Nếu là tháng quá khứ, giả sử đã trả vào cuối tháng đó
            const paymentDate = isCurrentMonth 
              ? null 
              : new Date(currentYear, currentMonth, 0) // Ngày cuối tháng
            
            const grossPay = baseSalary + bonuses
            const netPay = grossPay // Chưa có deductions và tax
            
            monthRecords.push({
              id: `temp-${employee.id}-${payPeriod}`,
              payPeriod,
              baseSalary,
              allowances: 0,
              overtime: 0,
              bonuses,
              grossPay,
              deductions: 0,
              tax: 0,
              netPay,
              status,
              paymentDate: paymentDate ? paymentDate.toISOString() : null,
              employeeId: employee.id,
              employee: {
                firstName: employee.firstName,
                lastName: employee.lastName,
                employeeId: employee.employeeId,
              },
              isEstimated: true,
            })
            
            // Chuyển sang tháng tiếp theo
            currentMonth++
            if (currentMonth > 12) {
              currentMonth = 1
              currentYear++
            }
          }
        }
      }
      
      if (monthRecords.length > 0) {
        // Sắp xếp theo payPeriod giảm dần
        monthRecords.sort((a, b) => b.payPeriod.localeCompare(a.payPeriod))
        
        // Filter by search query if provided
        if (search) {
          const searchLower = search.toLowerCase()
          monthRecords = monthRecords.filter(record =>
            record.employee.firstName.toLowerCase().includes(searchLower) ||
            record.employee.lastName.toLowerCase().includes(searchLower) ||
            record.employee.employeeId.toLowerCase().includes(searchLower) ||
            record.payPeriod.toLowerCase().includes(searchLower)
          )
        }
        
        return NextResponse.json(monthRecords)
      }
    }

    // Filter by search query if provided
    let filteredRecords = records
    if (search) {
      const searchLower = search.toLowerCase()
      filteredRecords = records.filter(record =>
        record.employee.firstName.toLowerCase().includes(searchLower) ||
        record.employee.lastName.toLowerCase().includes(searchLower) ||
        record.employee.employeeId.toLowerCase().includes(searchLower) ||
        record.payPeriod.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json(filteredRecords)
  } catch (error) {
    console.error('Error fetching payroll records:', error)
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
    const { employeeId, payPeriod, baseSalary, allowances, deductions, overtime, bonuses, tax } = body

    const grossPay = baseSalary + allowances + overtime + bonuses
    const netPay = grossPay - deductions - tax

    const record = await prisma.payrollRecord.create({
      data: {
        employeeId,
        payPeriod,
        baseSalary,
        allowances: allowances || 0,
        deductions: deductions || 0,
        overtime: overtime || 0,
        bonuses: bonuses || 0,
        grossPay,
        netPay,
        tax: tax || 0,
        paymentDate: new Date(body.paymentDate || Date.now()),
        status: 'PENDING',
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

    return NextResponse.json(record, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Payroll record for this period already exists' },
        { status: 400 }
      )
    }
    console.error('Error creating payroll record:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}





