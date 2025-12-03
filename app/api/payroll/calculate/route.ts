import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'HR' && session.user.role !== 'BOARD')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { payPeriod, employeeId } = body // payPeriod format: "YYYY-MM"

    if (!payPeriod) {
      return NextResponse.json(
        { error: 'Missing required field: payPeriod (format: YYYY-MM)' },
        { status: 400 }
      )
    }

    // Parse pay period
    const [year, month] = payPeriod.split('-').map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    // Get employees to calculate
    const where: any = { status: 'ACTIVE' }
    if (employeeId) {
      where.id = employeeId
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    })

    const results = []

    for (const employee of employees) {
      // Check if payroll record already exists
      const existing = await prisma.payrollRecord.findUnique({
        where: {
          employeeId_payPeriod: {
            employeeId: employee.id,
            payPeriod,
          },
        },
      })

      if (existing) {
        results.push({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          status: 'skipped',
          message: 'Payroll record already exists',
        })
        continue
      }

      // Get attendance records for the period
      const attendances = await prisma.attendance.findMany({
        where: {
          employeeId: employee.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      })

      // Calculate base salary (monthly)
      const baseSalary = employee.salary || 0
      const dailySalary = baseSalary / 30 // Assuming 30 days per month

      // Calculate worked days and hours
      let workedDays = 0
      let totalHours = 0
      let overtimeHours = 0

      for (const attendance of attendances) {
        if (attendance.status === 'PRESENT' || attendance.status === 'HALF_DAY') {
          workedDays += attendance.status === 'HALF_DAY' ? 0.5 : 1
          
          if (attendance.totalHours) {
            totalHours += attendance.totalHours
            // Overtime if more than 8 hours per day
            if (attendance.totalHours > 8) {
              overtimeHours += attendance.totalHours - 8
            }
          }
        }
      }

      // Calculate overtime pay (1.5x hourly rate)
      const hourlyRate = dailySalary / 8
      const overtimePay = overtimeHours * hourlyRate * 1.5

      // Get approved leaves
      const leaves = await prisma.leave.findMany({
        where: {
          employeeId: employee.id,
          status: 'APPROVED',
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      })

      // Calculate leave days in period
      let leaveDays = 0
      for (const leave of leaves) {
        const leaveStart = leave.startDate > startDate ? leave.startDate : startDate
        const leaveEnd = leave.endDate < endDate ? leave.endDate : endDate
        const days = Math.ceil((leaveEnd.getTime() - leaveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
        leaveDays += days
      }

      // Base salary calculation (proportional to worked days)
      const actualBaseSalary = (workedDays / 30) * baseSalary

      // Get bonuses and allowances from employee records (if any)
      // This could be enhanced to pull from rewards or other sources
      const bonuses = 0 // Can be calculated from Reward records
      const allowances = 0 // Can be calculated from BenefitEnrollment

      // Calculate tax (simplified - 10% of gross pay)
      const grossPay = actualBaseSalary + overtimePay + bonuses + allowances
      const tax = grossPay * 0.1

      // Calculate deductions (insurance, etc.)
      const deductions = 0 // Can be calculated from BenefitEnrollment

      const netPay = grossPay - tax - deductions

      // Create payroll record
      try {
        const record = await prisma.payrollRecord.create({
          data: {
            employeeId: employee.id,
            payPeriod,
            baseSalary: actualBaseSalary,
            allowances,
            deductions,
            overtime: overtimePay,
            bonuses,
            grossPay,
            netPay,
            tax,
            paymentDate: new Date(year, month, 15), // Mid-month payment
            status: 'PENDING',
            notes: `Auto-calculated: ${workedDays} days worked, ${overtimeHours.toFixed(2)} overtime hours, ${leaveDays} leave days`,
          },
        })

        results.push({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          status: 'success',
          netPay,
          workedDays,
          overtimeHours: overtimeHours.toFixed(2),
        })
      } catch (error: any) {
        if (error.code === 'P2002') {
          results.push({
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            status: 'error',
            message: 'Payroll record already exists',
          })
        } else {
          results.push({
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            status: 'error',
            message: error.message || 'Unknown error',
          })
        }
      }
    }

    return NextResponse.json({
      payPeriod,
      totalEmployees: employees.length,
      results,
    })
  } catch (error) {
    console.error('Error calculating payroll:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






