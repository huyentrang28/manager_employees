import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hrms.com' },
    update: {},
    create: {
      email: 'admin@hrms.com',
      password: hashedPassword,
      role: 'BOARD',
    },
  })

  // Create HR user
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@hrms.com' },
    update: {},
    create: {
      email: 'hr@hrms.com',
      password: hashedPassword,
      role: 'HR',
    },
  })

  // Create Manager user
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@hrms.com' },
    update: {},
    create: {
      email: 'manager@hrms.com',
      password: hashedPassword,
      role: 'MANAGER',
    },
  })

  // Create Employee user
  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@hrms.com' },
    update: {},
    create: {
      email: 'employee@hrms.com',
      password: hashedPassword,
      role: 'EMPLOYEE',
    },
  })

  // Create employees
  const adminEmployee = await prisma.employee.upsert({
    where: { employeeId: 'EMP001' },
    update: {},
    create: {
      employeeId: 'EMP001',
      userId: adminUser.id,
      firstName: 'Admin',
      lastName: 'User',
      hireDate: new Date('2020-01-01'),
      department: 'Management',
      position: 'CEO',
      status: 'ACTIVE',
      salary: 50000000,
    },
  })

  const hrEmployee = await prisma.employee.upsert({
    where: { employeeId: 'EMP002' },
    update: {},
    create: {
      employeeId: 'EMP002',
      userId: hrUser.id,
      firstName: 'HR',
      lastName: 'Manager',
      hireDate: new Date('2021-01-01'),
      department: 'Human Resources',
      position: 'HR Manager',
      status: 'ACTIVE',
      salary: 30000000,
      managerId: adminEmployee.id,
    },
  })

  const managerEmployee = await prisma.employee.upsert({
    where: { employeeId: 'EMP003' },
    update: {},
    create: {
      employeeId: 'EMP003',
      userId: managerUser.id,
      firstName: 'Department',
      lastName: 'Manager',
      hireDate: new Date('2022-01-01'),
      department: 'Operations',
      position: 'Operations Manager',
      status: 'ACTIVE',
      salary: 25000000,
      managerId: adminEmployee.id,
    },
  })

  const regularEmployee = await prisma.employee.upsert({
    where: { employeeId: 'EMP004' },
    update: {},
    create: {
      employeeId: 'EMP004',
      userId: employeeUser.id,
      firstName: 'Regular',
      lastName: 'Employee',
      hireDate: new Date('2023-01-01'),
      department: 'Operations',
      position: 'Staff',
      status: 'ACTIVE',
      salary: 15000000,
      managerId: managerEmployee.id,
    },
  })

  // Create sample job posting (only if it doesn't exist)
  const existingJob = await prisma.jobPosting.findFirst({
    where: { title: 'Senior Software Developer' },
  })
  
  if (!existingJob) {
    await prisma.jobPosting.create({
      data: {
        title: 'Senior Software Developer',
        department: 'IT',
        description: 'We are looking for an experienced software developer...',
        requirements: '5+ years of experience, Bachelor degree in Computer Science...',
        location: 'Ho Chi Minh City',
        employmentType: 'FULL_TIME',
        salaryRange: '20,000,000 - 30,000,000 VND',
        status: 'OPEN',
      },
    })
  }

  // Create sample training program (only if it doesn't exist)
  const existingTraining = await prisma.trainingProgram.findFirst({
    where: { title: 'Leadership Development Program' },
  })
  
  if (!existingTraining) {
    await prisma.trainingProgram.create({
      data: {
        title: 'Leadership Development Program',
        description: 'Comprehensive leadership training for managers...',
        category: 'Soft Skills',
        duration: 40,
        provider: 'Internal Training',
        cost: 5000000,
        status: 'ONGOING',
      },
    })
  }

  // Create sample benefit (only if it doesn't exist)
  const existingBenefit = await prisma.benefit.findFirst({
    where: { name: 'Health Insurance' },
  })
  
  if (!existingBenefit) {
    await prisma.benefit.create({
      data: {
        name: 'Health Insurance',
        description: 'Comprehensive health insurance coverage',
        category: 'Health',
        coverage: 'Full medical coverage including dental and vision',
        eligibility: 'All full-time employees',
        cost: 2000000,
        isActive: true,
      },
    })
  }

  console.log('Seeding completed!')
  console.log('\nTest accounts created:')
  console.log('Admin: admin@hrms.com / admin123')
  console.log('HR: hr@hrms.com / admin123')
  console.log('Manager: manager@hrms.com / admin123')
  console.log('Employee: employee@hrms.com / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

