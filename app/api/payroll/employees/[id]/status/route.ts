import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * API để cập nhật trạng thái thanh toán lương cho một tháng cụ thể
 * PUT: Cập nhật hoặc tạo PayrollRecord với status mới
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  let body: any = null
  let employeeId: string | undefined
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'HR' && session.user.role !== 'BOARD')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle params as Promise or object
    const resolvedParams = await Promise.resolve(params)
    employeeId = resolvedParams.id

    if (!employeeId || typeof employeeId !== 'string' || employeeId.trim() === '') {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
    }

    employeeId = employeeId.trim()
    body = await request.json()
    const { payPeriod, status } = body

    if (!payPeriod || !status) {
      return NextResponse.json(
        { error: 'payPeriod and status are required' },
        { status: 400 }
      )
    }

    if (!['PAID', 'PENDING', 'PROCESSED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be PAID, PENDING, PROCESSED, or CANCELLED' },
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

    // Lấy thông tin nhân viên và hợp đồng
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        contracts: {
          where: { status: 'ACTIVE' },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        rewards: {
          where: {
            rewardType: 'BONUS',
          },
        },
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const contract = employee.contracts[0]
    if (!contract) {
      return NextResponse.json(
        { error: 'Employee has no active contract' },
        { status: 400 }
      )
    }

    const baseSalary = contract.salary || employee.salary || 0

    // Tính tổng thưởng cho tháng này
    let bonuses = 0
    employee.rewards.forEach((reward) => {
      let rewardPayPeriod: string | null = reward.payPeriod
      if (!rewardPayPeriod && reward.date) {
        const rewardDate = new Date(reward.date)
        const year = rewardDate.getFullYear()
        const month = rewardDate.getMonth() + 1
        rewardPayPeriod = `${year}-${String(month).padStart(2, '0')}`
      }

      if (rewardPayPeriod === payPeriod) {
        bonuses += reward.amount || 0
      }
    })

    // Tìm hoặc tạo PayrollRecord
    let payrollRecord = await prisma.payrollRecord.findUnique({
      where: {
        employeeId_payPeriod: {
          employeeId: employeeId,
          payPeriod,
        },
      },
    })

    const grossPay = baseSalary + bonuses
    const netPay = grossPay // Chưa có deductions và tax

    if (payrollRecord) {
      // Cập nhật PayrollRecord hiện có
      payrollRecord = await prisma.payrollRecord.update({
        where: { id: payrollRecord.id },
        data: {
          status,
          paymentDate: status === 'PAID' ? new Date() : payrollRecord.paymentDate,
          // Cập nhật lại bonuses và netPay nếu cần
          bonuses,
          grossPay,
          netPay,
        },
      })
    } else {
      // Tạo PayrollRecord mới
      try {
        payrollRecord = await prisma.payrollRecord.create({
          data: {
            employeeId: employeeId,
            payPeriod,
            baseSalary,
            allowances: 0,
            deductions: 0,
            overtime: 0,
            bonuses,
            grossPay,
            netPay,
            tax: 0,
            paymentDate: status === 'PAID' ? new Date() : new Date(),
            status,
            notes: `Tự động tạo khi cập nhật trạng thái`,
          },
        })
      } catch (createError: any) {
        // Nếu lỗi do record đã tồn tại (race condition), thử tìm lại
        if (createError.code === 'P2002') {
          payrollRecord = await prisma.payrollRecord.findUnique({
            where: {
              employeeId_payPeriod: {
                employeeId: employeeId,
                payPeriod,
              },
            },
          })
          
          if (payrollRecord) {
            // Cập nhật record vừa tìm thấy
            payrollRecord = await prisma.payrollRecord.update({
              where: { id: payrollRecord.id },
              data: {
                status,
                paymentDate: status === 'PAID' ? new Date() : payrollRecord.paymentDate,
                bonuses,
                grossPay,
                netPay,
              },
            })
          } else {
            throw createError
          }
        } else {
          throw createError
        }
      }
    }

    return NextResponse.json({
      payrollRecord,
      message: `Trạng thái đã được cập nhật thành ${status === 'PAID' ? 'Đã trả' : status === 'PENDING' ? 'Chưa trả' : status}`,
    })
  } catch (error: any) {
    console.error('Error updating payroll status:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Payroll record already exists for this period' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

