import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'


/**
 * API để lấy danh sách nhân viên với thông tin lương tổng hợp cho admin
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'HR' && session.user.role !== 'BOARD')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: {
        contracts: {
          where: { status: 'ACTIVE' },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        payrollRecords: {
          where: { status: 'PAID' },
          select: {
            netPay: true,
            payPeriod: true,
            bonuses: true,
          },
        },
      },
      orderBy: { firstName: 'asc' },
    })

    // Lấy tất cả thưởng của các nhân viên
    const employeeIds = employees.map(e => e.id)
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

    const employeesWithSalary = employees.map((emp) => {
      const contract = emp.contracts[0]
      const baseSalary = contract?.salary || emp.salary || 0
      
      // Tổng lương đã trả từ PayrollRecord
      let totalPaid = emp.payrollRecords.reduce((sum, record) => sum + record.netPay, 0)
      
      // Nếu không có PayrollRecord, tính từ hợp đồng (chỉ các tháng đã hoàn thành)
      if (totalPaid === 0 && contract) {
        const contractStartDate = new Date(contract.startDate)
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1
        
        const startYear = contractStartDate.getFullYear()
        const startMonth = contractStartDate.getMonth() + 1
        
        // Tính số tháng đã hoàn thành (không tính tháng hiện tại)
        let completedMonths = 0
        if (startYear < currentYear || (startYear === currentYear && startMonth < currentMonth)) {
          if (startYear === currentYear) {
            completedMonths = currentMonth - startMonth // Không tính tháng hiện tại
          } else {
            completedMonths = (currentYear - startYear) * 12 + (currentMonth - startMonth) // Không tính tháng hiện tại
          }
        }
        
        // Tính lương cho các tháng đã hoàn thành
        if (completedMonths > 0) {
          totalPaid = baseSalary * completedMonths
          
          // Cộng thêm thưởng từ các tháng đã hoàn thành
          const employeeRewards = rewardMap.get(emp.id)
          if (employeeRewards) {
            // Tính tổng thưởng cho các tháng đã hoàn thành
            let currentDate = new Date(contractStartDate.getFullYear(), contractStartDate.getMonth(), 1)
            const endDate = new Date(currentYear, currentMonth - 1, 0) // Ngày cuối tháng trước
            
            while (currentDate <= endDate) {
              const year = currentDate.getFullYear()
              const month = currentDate.getMonth() + 1
              const payPeriod = `${year}-${String(month).padStart(2, '0')}`
              
              const bonus = employeeRewards.get(payPeriod) || 0
              totalPaid += bonus
              
              currentDate.setMonth(currentDate.getMonth() + 1)
            }
          }
        }
      } else if (totalPaid > 0) {
        // Nếu có PayrollRecord, vẫn cần cộng thêm thưởng chưa được tính vào PayrollRecord
        // (trường hợp thưởng được thêm sau khi PayrollRecord đã được tạo)
        const employeeRewards = rewardMap.get(emp.id)
        if (employeeRewards) {
          // Tính tổng thưởng cho các tháng đã trả lương
          emp.payrollRecords.forEach((record) => {
            const bonus = employeeRewards.get(record.payPeriod) || 0
            // Nếu thưởng chưa được tính vào PayrollRecord, cộng thêm
            if (bonus > 0 && record.bonuses < bonus) {
              totalPaid += (bonus - record.bonuses)
            }
          })
        }
      }
      
      // Tính số tháng đã hoàn thành (nếu có hợp đồng)
      let completedMonths = 0
      if (contract) {
        const contractStartDate = new Date(contract.startDate)
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1
        
        const startYear = contractStartDate.getFullYear()
        const startMonth = contractStartDate.getMonth() + 1
        
        if (startYear < currentYear || (startYear === currentYear && startMonth < currentMonth)) {
          if (startYear === currentYear) {
            completedMonths = currentMonth - startMonth
          } else {
            completedMonths = (currentYear - startYear) * 12 + (currentMonth - startMonth)
          }
        }
      }
      
      return {
        id: emp.id,
        employeeId: emp.employeeId,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department,
        position: emp.position,
        baseSalary,
        totalPaid,
        completedMonths,
        hasContract: !!contract,
        contractStartDate: contract?.startDate,
      }
    })

    return NextResponse.json({ employees: employeesWithSalary })
  } catch (error) {
    console.error('Error fetching employees with salary:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

