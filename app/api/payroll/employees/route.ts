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

    // Lấy TẤT CẢ nhân viên (không filter theo status) - kể cả đã tắt trạng thái hoặc xóa
    const employees = await prisma.employee.findMany({
      include: {
        contracts: {
          where: { status: 'ACTIVE' },
          orderBy: { startDate: 'desc' },
          take: 1,
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
      
      // Tính tổng lương đã trả theo thời gian bắt đầu hợp đồng + thưởng đến thời điểm hiện tại
      // Không phụ thuộc vào PayrollRecord
      let totalPaid = 0
      
      if (contract && baseSalary > 0) {
        const contractStartDate = new Date(contract.startDate)
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1
        
        const startYear = contractStartDate.getFullYear()
        const startMonth = contractStartDate.getMonth() + 1
        
        // Xác định tháng cuối cùng cần tính lương
        // 1. Nếu nhân viên không ACTIVE: chỉ tính đến tháng trước tháng hiện tại
        // 2. Nếu hợp đồng có endDate: chỉ tính đến tháng của endDate
        // 3. Lấy min của các điều kiện trên
        let endYear = currentYear
        let endMonth = currentMonth - 1 // Mặc định: tháng trước tháng hiện tại
        
        // Nếu nhân viên không ACTIVE, chỉ tính đến tháng trước
        if (emp.status !== 'ACTIVE') {
          endMonth = currentMonth - 1
          if (endMonth < 1) {
            endMonth = 12
            endYear = currentYear - 1
          }
        }
        
        // Nếu hợp đồng có endDate, chỉ tính đến tháng của endDate
        if (contract.endDate && !contract.isIndefinite) {
          const contractEndDate = new Date(contract.endDate)
          const contractEndYear = contractEndDate.getFullYear()
          const contractEndMonth = contractEndDate.getMonth() + 1
          
          // Lấy min (tháng cuối cùng hợp đồng, tháng cuối cùng nhân viên còn ACTIVE)
          if (contractEndYear < endYear || (contractEndYear === endYear && contractEndMonth < endMonth)) {
            endYear = contractEndYear
            endMonth = contractEndMonth
          }
        }
        
        // Tính số tháng đã hoàn thành (từ tháng bắt đầu hợp đồng đến endMonth)
        let completedMonths = 0
        if (startYear < endYear || (startYear === endYear && startMonth <= endMonth)) {
          if (startYear === endYear) {
            completedMonths = endMonth - startMonth + 1
          } else {
            completedMonths = (endYear - startYear) * 12 + (endMonth - startMonth + 1)
          }
        }
        
        // Tính lương cơ bản cho các tháng đã hoàn thành
        if (completedMonths > 0) {
          totalPaid = baseSalary * completedMonths
          
          // Cộng thêm thưởng cho các tháng đã hoàn thành
          const employeeRewards = rewardMap.get(emp.id)
          if (employeeRewards) {
            let currentDate = new Date(contractStartDate.getFullYear(), contractStartDate.getMonth(), 1)
            const endDate = new Date(endYear, endMonth, 0) // Ngày cuối tháng endMonth
            
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

