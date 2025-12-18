import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'


/**
 * API để lấy tổng lương đã trả và tổng thưởng đã trả
 * Đơn giản: Tính từ hợp đồng cho các tháng đã hoàn thành (không tính tháng hiện tại)
 * Hỗ trợ filter theo tháng/năm
 * Query params: year (YYYY), month (MM), period (YYYY-MM)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const period = searchParams.get('period') // YYYY-MM

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const currentPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`

    // Lấy tất cả PayrollRecord để tính currentMonth và currentYear
    const allRecords = await prisma.payrollRecord.findMany({
      select: {
        payPeriod: true,
        netPay: true,
        bonuses: true,
        status: true,
        employeeId: true,
      },
    })

    // Xác định employeeId nếu là EMPLOYEE, HR, hoặc MANAGER
    let currentEmployeeId: string | null = null
    if (session.user.role === 'EMPLOYEE' || session.user.role === 'HR' || session.user.role === 'MANAGER') {
      const employee = await prisma.employee.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      if (employee) {
        currentEmployeeId = employee.id
      } else {
        // Nếu không tìm thấy employee, trả về dữ liệu rỗng
        return NextResponse.json({
          totalPaidSalary: 0,
          totalPaidBonuses: 0,
          currentMonth: {
            period: currentPeriod,
            salary: 0,
            bonuses: 0,
            count: 0,
          },
          currentYear: {
            year: year || String(currentYear),
            salary: 0,
            bonuses: 0,
            count: 0,
          },
          monthlyBreakdown: [],
          yearlyBreakdown: [],
        })
      }
    }

    // Lấy nhân viên có hợp đồng (chỉ lấy các field cần thiết)
    // Nếu là EMPLOYEE, HR, hoặc MANAGER, chỉ lấy của chính họ
    // KHÔNG filter theo status - tính cho TẤT CẢ nhân viên (kể cả đã tắt trạng thái)
    const employees = await prisma.employee.findMany({
      where: currentEmployeeId 
        ? { id: currentEmployeeId }
        : {},
      select: {
        id: true,
        salary: true,
        status: true,
        contracts: {
          where: { status: 'ACTIVE' },
          orderBy: { startDate: 'desc' },
          take: 1,
          select: {
            startDate: true,
            endDate: true,
            isIndefinite: true,
            salary: true,
          },
        },
        rewards: {
          where: {
            rewardType: 'BONUS',
          },
          select: {
            amount: true,
            payPeriod: true,
            date: true,
          },
        },
      },
    })

    let totalPaidSalary = 0
    let totalPaidBonuses = 0
    const monthlyStats = new Map<string, { salary: number; bonuses: number; count: number }>()
    const yearlyStats = new Map<string, { salary: number; bonuses: number; count: number }>()

    // Tính từ hợp đồng cho tất cả các tháng (đơn giản như các năm 2022-2024)
    // Tính currentMonth và currentYear từ tất cả nhân viên (bao gồm cả tháng hiện tại)
    for (const employee of employees) {
      const contract = employee.contracts[0]
      if (!contract) continue

      const baseSalary = contract.salary || employee.salary || 0
      if (baseSalary === 0) continue

      const contractStartDate = new Date(contract.startDate)
      const startYear = contractStartDate.getFullYear()
      const startMonth = contractStartDate.getMonth() + 1

      // Tạo map thưởng theo payPeriod
      const rewardMap = new Map<string, number>()
      employee.rewards.forEach((reward) => {
        let payPeriod: string | null = reward.payPeriod
        if (!payPeriod && reward.date) {
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

      // Xác định tháng cuối cùng cần tính lương
      // 1. Nếu nhân viên không ACTIVE: chỉ tính đến tháng trước tháng hiện tại
      // 2. Nếu hợp đồng có endDate: chỉ tính đến tháng của endDate
      // 3. Lấy min của các điều kiện trên
      let endYear = currentYear
      let endMonth = currentMonth - 1 // Mặc định: tháng trước tháng hiện tại
      
      // Nếu nhân viên không ACTIVE, chỉ tính đến tháng trước
      if (employee.status !== 'ACTIVE') {
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

      // Tính từng tháng từ ngày bắt đầu hợp đồng đến endMonth
      let currentYearLoop = startYear
      let currentMonthLoop = startMonth

      while (
        currentYearLoop < endYear ||
        (currentYearLoop === endYear && currentMonthLoop <= endMonth)
      ) {
        const payPeriod = `${currentYearLoop}-${String(currentMonthLoop).padStart(2, '0')}`
        const bonuses = rewardMap.get(payPeriod) || 0
        const netPay = baseSalary + bonuses
        const isCurrentMonth = payPeriod === currentPeriod
        const isCompletedMonth = currentYearLoop < endYear || (currentYearLoop === endYear && currentMonthLoop < endMonth)

        // Áp dụng filter nếu có
        let shouldInclude = true
        if (period && payPeriod !== period) {
          shouldInclude = false
        } else if (year && month) {
          const filterPeriod = `${year}-${String(month).padStart(2, '0')}`
          if (payPeriod !== filterPeriod) {
            shouldInclude = false
          }
        } else if (year && !payPeriod.startsWith(year)) {
          shouldInclude = false
        }

        if (shouldInclude) {
          // Thống kê theo tháng (tính cả tháng hiện tại)
          const monthStat = monthlyStats.get(payPeriod) || { salary: 0, bonuses: 0, count: 0 }
          monthStat.salary += netPay
          monthStat.bonuses += bonuses
          monthStat.count += 1
          monthlyStats.set(payPeriod, monthStat)
        }

        // Chuyển sang tháng tiếp theo
        currentMonthLoop++
        if (currentMonthLoop > 12) {
          currentMonthLoop = 1
          currentYearLoop++
        }
      }
    }

    // Tính lại yearlyStats từ monthlyStats để đảm bảo chính xác (chỉ tính các tháng đã hoàn thành, không tính tháng hiện tại)                          
    for (const [payPeriod, stats] of Array.from(monthlyStats.entries())) {
      // Chỉ tính các tháng đã hoàn thành (không tính tháng hiện tại)
      if (payPeriod !== currentPeriod) {
        const yearKey = payPeriod.split('-')[0]
        const yearStat = yearlyStats.get(yearKey) || { salary: 0, bonuses: 0, count: 0 }
        yearStat.salary += stats.salary
        yearStat.bonuses += stats.bonuses
        yearStat.count += stats.count
        yearlyStats.set(yearKey, yearStat)
      }
    }

    // Tính lại totalPaidSalary và totalPaidBonuses từ monthlyStats (chỉ các tháng đã hoàn thành)
    // Đảm bảo tính đúng, không trùng lặp
    totalPaidSalary = 0
    totalPaidBonuses = 0
    for (const [payPeriod, stats] of Array.from(monthlyStats.entries())) {
      // Chỉ tính các tháng đã hoàn thành (không tính tháng hiện tại)
      if (payPeriod !== currentPeriod) {
        // Áp dụng filter nếu có
        let shouldInclude = true
        if (period && payPeriod !== period) {
          shouldInclude = false
        } else if (year && month) {
          const filterPeriod = `${year}-${String(month).padStart(2, '0')}`
          if (payPeriod !== filterPeriod) {
            shouldInclude = false
          }
        } else if (year && !payPeriod.startsWith(year)) {
          shouldInclude = false
        }

        if (shouldInclude) {
          totalPaidSalary += stats.salary
          totalPaidBonuses += stats.bonuses
        }
      }
    }

    // Lấy tháng hiện tại và năm hiện tại
    const currentMonthStat = monthlyStats.get(currentPeriod) || { salary: 0, bonuses: 0, count: 0 }
    
    // currentYearStat: Luôn tính lương của năm hiện tại từ dữ liệu gốc (không phụ thuộc filter)
    // Tính lại từ employees để đảm bảo có đủ dữ liệu
    const currentYearStat = { salary: 0, bonuses: 0, count: 0 }
    for (const employee of employees) {
      const contract = employee.contracts[0]
      if (!contract) continue

      const baseSalary = contract.salary || employee.salary || 0
      if (baseSalary === 0) continue

      const contractStartDate = new Date(contract.startDate)
      const startYear = contractStartDate.getFullYear()
      const startMonth = contractStartDate.getMonth() + 1

      // Tạo map thưởng theo payPeriod
      const rewardMap = new Map<string, number>()
      employee.rewards.forEach((reward) => {
        let payPeriod: string | null = reward.payPeriod
        if (!payPeriod && reward.date) {
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

      // Xác định tháng cuối cùng cần tính lương
      let endYear = currentYear
      let endMonth = currentMonth - 1 // Mặc định: tháng trước tháng hiện tại
      
      // Nếu nhân viên không ACTIVE, chỉ tính đến tháng trước
      if (employee.status !== 'ACTIVE') {
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

      // Tính các tháng của năm hiện tại (chỉ các tháng đã hoàn thành, không tính tháng hiện tại)
      let currentYearLoop = startYear
      let currentMonthLoop = startMonth

      while (
        currentYearLoop < endYear ||
        (currentYearLoop === endYear && currentMonthLoop <= endMonth)
      ) {
        const payPeriod = `${currentYearLoop}-${String(currentMonthLoop).padStart(2, '0')}`
        
        // Chỉ tính các tháng của năm hiện tại và đã hoàn thành
        if (payPeriod.startsWith(String(currentYear)) && payPeriod !== currentPeriod) {
          const bonuses = rewardMap.get(payPeriod) || 0
          const netPay = baseSalary + bonuses
          
          currentYearStat.salary += netPay
          currentYearStat.bonuses += bonuses
          currentYearStat.count += 1
        }

        // Chuyển sang tháng tiếp theo
        currentMonthLoop++
        if (currentMonthLoop > 12) {
          currentMonthLoop = 1
          currentYearLoop++
        }
      }
    }
    
    // targetYear: Năm được filter (nếu có) hoặc năm hiện tại
    const targetYear = year || String(currentYear)

    // Chuyển đổi Map thành Array để trả về
    const monthlyBreakdown = Array.from(monthlyStats.entries())
      .map(([period, stats]) => ({
        period,
        year: period.split('-')[0],
        month: period.split('-')[1],
        salary: stats.salary,
        bonuses: stats.bonuses,
        count: stats.count,
      }))
      .sort((a, b) => b.period.localeCompare(a.period))

    // Tính lại totalPaidSalary và totalPaidBonuses từ monthlyStats (chỉ các tháng đã hoàn thành)
    if (year && !month && !period) {
      // Nếu filter theo năm, tính lại từ monthlyStats của năm đó
      totalPaidSalary = 0
      totalPaidBonuses = 0
      for (const [payPeriod, stats] of Array.from(monthlyStats.entries())) {
        if (payPeriod.startsWith(year) && payPeriod !== currentPeriod) {
          totalPaidSalary += stats.salary
          totalPaidBonuses += stats.bonuses
        }
      }
    }

    const yearlyBreakdown = Array.from(yearlyStats.entries())
      .map(([year, stats]) => ({
        year,
        salary: stats.salary,
        bonuses: stats.bonuses,
        count: stats.count,
      }))
      .sort((a, b) => b.year.localeCompare(a.year))

    return NextResponse.json({
      totalPaidSalary,
      totalPaidBonuses,
      currentMonth: {
        period: currentPeriod,
        salary: currentMonthStat.salary,
        bonuses: currentMonthStat.bonuses,
        count: currentMonthStat.count,
      },
      currentYear: {
        year: targetYear,
        salary: currentYearStat.salary,
        bonuses: currentYearStat.bonuses,
        count: currentYearStat.count,
      },
      monthlyBreakdown,
      yearlyBreakdown,
    })
  } catch (error) {
    console.error('Error fetching payroll stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
