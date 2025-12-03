import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * API để cập nhật trạng thái thanh toán lương cho một PayrollRecord
 * PUT: Cập nhật status của PayrollRecord
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  let body: any = null
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'HR' && session.user.role !== 'BOARD')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle params as Promise or object
    const resolvedParams = await Promise.resolve(params)
    const recordId = resolvedParams.id

    if (!recordId) {
      return NextResponse.json({ error: 'PayrollRecord ID is required' }, { status: 400 })
    }

    body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      )
    }

    if (!['PAID', 'PENDING', 'PROCESSED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be PAID, PENDING, PROCESSED, or CANCELLED' },
        { status: 400 }
      )
    }

    // Tìm PayrollRecord
    let payrollRecord = await prisma.payrollRecord.findUnique({
      where: { id: recordId },
    })

    if (!payrollRecord) {
      // Nếu không tìm thấy PayrollRecord, có thể là record ước tính (isEstimated)
      // ID có dạng: temp-{employeeId}-{payPeriod}
      // Cần tạo PayrollRecord mới từ thông tin này
      const tempIdMatch = recordId.match(/^temp-(.+)-(\d{4}-\d{2})$/)
      
      if (!tempIdMatch) {
        return NextResponse.json(
          { error: 'PayrollRecord not found and cannot create from invalid ID format' },
          { status: 404 }
        )
      }

      const [, employeeId, payPeriod] = tempIdMatch

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
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        )
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

      const grossPay = baseSalary + bonuses
      const netPay = grossPay // Chưa có deductions và tax

      // Tạo PayrollRecord mới
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
          paymentDate: status === 'PAID' ? new Date() : new Date(),
          status,
          notes: `Tự động tạo khi cập nhật trạng thái từ record ước tính`,
        },
      })
    } else {
      // Cập nhật PayrollRecord hiện có
      payrollRecord = await prisma.payrollRecord.update({
        where: { id: recordId },
        data: {
          status,
          paymentDate: status === 'PAID' ? new Date() : payrollRecord.paymentDate,
        },
      })
    }

    return NextResponse.json({
      payrollRecord,
      message: `Trạng thái đã được cập nhật thành ${status === 'PAID' ? 'Đã trả' : status === 'PENDING' ? 'Chưa trả' : status}`,
    })
  } catch (error: any) {
    console.error('Error updating payroll status:', error)

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

