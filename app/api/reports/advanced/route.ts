import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const reportType = searchParams.get('type') || 'overview'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1)
    const end = endDate ? new Date(endDate) : new Date()

    let result: any = {}

    switch (reportType) {
      case 'headcount':
        result = await getHeadcountReport(start, end)
        break
      case 'turnover':
        result = await getTurnoverReport(start, end)
        break
      case 'costs':
        result = await getCostsReport(start, end)
        break
      case 'recruitment':
        result = await getRecruitmentReport(start, end)
        break
      case 'training':
        result = await getTrainingReport(start, end)
        break
      case 'overview':
      default:
        result = await getOverviewReport(start, end)
        break
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getHeadcountReport(start: Date, end: Date) {
  const totalEmployees = await prisma.employee.count({
    where: {
      status: 'ACTIVE',
    },
  })

  const employeesByDepartment = await prisma.employee.groupBy({
    by: ['department'],
    where: {
      status: 'ACTIVE',
    },
    _count: true,
  })

  const employeesByStatus = await prisma.employee.groupBy({
    by: ['status'],
    _count: true,
  })

  const newHires = await prisma.employee.count({
    where: {
      hireDate: {
        gte: start,
        lte: end,
      },
    },
  })

  return {
    totalEmployees,
    newHires,
    employeesByDepartment: employeesByDepartment.map((d) => ({
      department: d.department || 'Unknown',
      count: d._count,
    })),
    employeesByStatus: employeesByStatus.map((s) => ({
      status: s.status,
      count: s._count,
    })),
  }
}

async function getTurnoverReport(start: Date, end: Date) {
  const terminated = await prisma.employee.count({
    where: {
      status: 'TERMINATED',
      updatedAt: {
        gte: start,
        lte: end,
      },
    },
  })

  const totalAtStart = await prisma.employee.count({
    where: {
      hireDate: {
        lte: start,
      },
      status: {
        not: 'TERMINATED',
      },
    },
  })

  const newHires = await prisma.employee.count({
    where: {
      hireDate: {
        gte: start,
        lte: end,
      },
    },
  })

  const turnoverRate = totalAtStart > 0 ? (terminated / totalAtStart) * 100 : 0

  return {
    terminated,
    newHires,
    totalAtStart,
    turnoverRate: turnoverRate.toFixed(2),
  }
}

async function getCostsReport(start: Date, end: Date) {
  const payrollRecords = await prisma.payrollRecord.findMany({
    where: {
      paymentDate: {
        gte: start,
        lte: end,
      },
      status: 'PAID',
    },
  })

  const totalPayroll = payrollRecords.reduce((sum, record) => sum + record.netPay, 0)
  const totalGrossPay = payrollRecords.reduce((sum, record) => sum + record.grossPay, 0)
  const totalTax = payrollRecords.reduce((sum, record) => sum + record.tax, 0)
  const totalDeductions = payrollRecords.reduce((sum, record) => sum + record.deductions, 0)
  const totalBonuses = payrollRecords.reduce((sum, record) => sum + record.bonuses, 0)

  const trainingCosts = await prisma.trainingProgram.aggregate({
    where: {
      startDate: {
        gte: start,
        lte: end,
      },
    },
    _sum: {
      cost: true,
    },
  })

  return {
    totalPayroll,
    totalGrossPay,
    totalTax,
    totalDeductions,
    totalBonuses,
    trainingCosts: trainingCosts._sum.cost || 0,
    totalCosts: totalPayroll + (trainingCosts._sum.cost || 0),
  }
}

async function getRecruitmentReport(start: Date, end: Date) {
  const jobPostings = await prisma.jobPosting.count({
    where: {
      postedDate: {
        gte: start,
        lte: end,
      },
    },
  })

  const applications = await prisma.jobApplication.count({
    where: {
      appliedDate: {
        gte: start,
        lte: end,
      },
    },
  })

  const applicationsByStatus = await prisma.jobApplication.groupBy({
    by: ['status'],
    where: {
      appliedDate: {
        gte: start,
        lte: end,
      },
    },
    _count: true,
  })

  const accepted = await prisma.jobApplication.count({
    where: {
      status: 'ACCEPTED',
      appliedDate: {
        gte: start,
        lte: end,
      },
    },
  })

  return {
    jobPostings,
    totalApplications: applications,
    accepted,
    acceptanceRate: applications > 0 ? ((accepted / applications) * 100).toFixed(2) : '0',
    applicationsByStatus: applicationsByStatus.map((s) => ({
      status: s.status,
      count: s._count,
    })),
  }
}

async function getTrainingReport(start: Date, end: Date) {
  const programs = await prisma.trainingProgram.count({
    where: {
      startDate: {
        gte: start,
        lte: end,
      },
    },
  })

  const enrollments = await prisma.trainingEnrollment.count({
    where: {
      enrollmentDate: {
        gte: start,
        lte: end,
      },
    },
  })

  const completed = await prisma.trainingEnrollment.count({
    where: {
      status: 'COMPLETED',
      completionDate: {
        gte: start,
        lte: end,
      },
    },
  })

  const averageScore = await prisma.trainingEnrollment.aggregate({
    where: {
      completionDate: {
        gte: start,
        lte: end,
      },
      score: {
        not: null,
      },
    },
    _avg: {
      score: true,
    },
  })

  return {
    programs,
    enrollments,
    completed,
    completionRate: enrollments > 0 ? ((completed / enrollments) * 100).toFixed(2) : '0',
    averageScore: averageScore._avg.score?.toFixed(2) || '0',
  }
}

async function getOverviewReport(start: Date, end: Date) {
  const headcount = await getHeadcountReport(start, end)
  const turnover = await getTurnoverReport(start, end)
  const costs = await getCostsReport(start, end)
  const recruitment = await getRecruitmentReport(start, end)
  const training = await getTrainingReport(start, end)

  return {
    headcount,
    turnover,
    costs,
    recruitment,
    training,
  }
}






