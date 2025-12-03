import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const payrollRecord = await prisma.payrollRecord.findUnique({
      where: { id: resolvedParams.id },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true,
            position: true,
            phone: true,
            address: true,
          },
        },
      },
    })

    if (!payrollRecord) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 })
    }

    // Check permission
    if (session.user.role === 'EMPLOYEE' && payrollRecord.employeeId !== session.user.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Format payslip data
    const payslip = {
      employee: {
        name: `${payrollRecord.employee.firstName} ${payrollRecord.employee.lastName}`,
        employeeId: payrollRecord.employee.employeeId,
        department: payrollRecord.employee.department,
        position: payrollRecord.employee.position,
      },
      payPeriod: payrollRecord.payPeriod,
      paymentDate: payrollRecord.paymentDate,
      earnings: {
        baseSalary: payrollRecord.baseSalary,
        overtime: payrollRecord.overtime,
        bonuses: payrollRecord.bonuses,
        allowances: payrollRecord.allowances,
        grossPay: payrollRecord.grossPay,
      },
      deductions: {
        tax: payrollRecord.tax,
        other: payrollRecord.deductions,
        total: payrollRecord.tax + payrollRecord.deductions,
      },
      netPay: payrollRecord.netPay,
      status: payrollRecord.status,
      notes: payrollRecord.notes,
    }

    return NextResponse.json(payslip)
  } catch (error) {
    console.error('Error fetching payslip:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






