import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Users, Briefcase, Clock, Calendar, TrendingUp, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

async function getDashboardStats(userId?: string, userRole?: string) {
  try {
    let totalPayroll = 0
    
    if (userRole === 'EMPLOYEE' && userId) {
      // EMPLOYEE: Tính lương theo thời gian hợp đồng (chỉ các tháng đã hoàn thành)
      const employee = await prisma.employee.findUnique({
        where: { userId },
        include: {
          contracts: {
            where: { status: 'ACTIVE' },
            orderBy: { startDate: 'desc' },
            take: 1,
          },
        },
      })
      
      if (employee && employee.contracts.length > 0) {
        const contract = employee.contracts[0]
        const baseSalary = contract.salary || employee.salary || 0
        
        if (baseSalary > 0) {
          // Tính số tháng đã hoàn thành (không tính tháng hiện tại nếu chưa kết thúc)
          const contractStartDate = new Date(contract.startDate)
          const now = new Date()
          const currentYear = now.getFullYear()
          const currentMonth = now.getMonth() + 1
          
          // Tính từ tháng bắt đầu hợp đồng đến tháng trước tháng hiện tại
          const startYear = contractStartDate.getFullYear()
          const startMonth = contractStartDate.getMonth() + 1
          
          // Số tháng đã hoàn thành = từ tháng bắt đầu đến tháng trước tháng hiện tại
          let completedMonths = 0
          if (startYear < currentYear || (startYear === currentYear && startMonth < currentMonth)) {
            // Có ít nhất 1 tháng đã hoàn thành
            if (startYear === currentYear) {
              completedMonths = currentMonth - startMonth
            } else {
              completedMonths = (currentYear - startYear) * 12 + (currentMonth - startMonth)
            }
          }
          
          // Tính tổng lương từ PayrollRecord đã trả
          const payrollResult = await prisma.payrollRecord.aggregate({
            _sum: { netPay: true },
            where: { 
              employeeId: employee.id,
              status: 'PAID'
            },
          }).catch(() => ({ _sum: { netPay: 0 } }))
          
          const paidFromRecords = payrollResult._sum.netPay || 0
          
          // Nếu có PayrollRecord đã trả, dùng số đó
          // Nếu không có, tính từ hợp đồng (chỉ các tháng đã hoàn thành)
          if (paidFromRecords > 0) {
            totalPayroll = paidFromRecords
          } else if (completedMonths > 0) {
            // Tính lương cơ bản cho các tháng đã hoàn thành
            totalPayroll = baseSalary * completedMonths
            
            // Cộng thêm thưởng từ Reward có payPeriod
            const rewards = await prisma.reward.findMany({
              where: {
                employeeId: employee.id,
                payPeriod: { not: null },
                rewardType: 'BONUS',
              },
            })
            
            for (const reward of rewards) {
              if (reward.payPeriod) {
                const [year, month] = reward.payPeriod.split('-').map(Number)
                const rewardDate = new Date(year, month - 1, 1)
                
                // Chỉ tính thưởng của các tháng đã hoàn thành
                if (rewardDate < new Date(currentYear, currentMonth - 1, 1)) {
                  totalPayroll += reward.amount || 0
                }
              }
            }
          }
        }
      }
    } else if (userRole === 'HR' || userRole === 'MANAGER') {
      // HR và MANAGER: Chỉ tính lương của chính họ (giống EMPLOYEE)
      const employee = await prisma.employee.findUnique({
        where: { userId },
        include: {
          contracts: {
            where: { status: 'ACTIVE' },
            orderBy: { startDate: 'desc' },
            take: 1,
          },
        },
      })
      
      if (employee && employee.contracts.length > 0) {
        const contract = employee.contracts[0]
        const baseSalary = contract.salary || employee.salary || 0
        
        if (baseSalary > 0) {
          const contractStartDate = new Date(contract.startDate)
          const now = new Date()
          const currentYear = now.getFullYear()
          const currentMonth = now.getMonth() + 1
          
          const startYear = contractStartDate.getFullYear()
          const startMonth = contractStartDate.getMonth() + 1
          
          let completedMonths = 0
          if (startYear < currentYear || (startYear === currentYear && startMonth < currentMonth)) {
            if (startYear === currentYear) {
              completedMonths = currentMonth - startMonth
            } else {
              completedMonths = (currentYear - startYear) * 12 + (currentMonth - startMonth)
            }
          }
          
          const payrollResult = await prisma.payrollRecord.aggregate({
            _sum: { netPay: true },
            where: { 
              employeeId: employee.id,
              status: 'PAID'
            },
          }).catch(() => ({ _sum: { netPay: 0 } }))
          
          const paidFromRecords = payrollResult._sum.netPay || 0
          
          if (paidFromRecords > 0) {
            totalPayroll = paidFromRecords
          } else if (completedMonths > 0) {
            totalPayroll = baseSalary * completedMonths
            
            const rewards = await prisma.reward.findMany({
              where: {
                employeeId: employee.id,
                payPeriod: { not: null },
                rewardType: 'BONUS',
              },
            })
            
            for (const reward of rewards) {
              if (reward.payPeriod) {
                const [year, month] = reward.payPeriod.split('-').map(Number)
                const rewardDate = new Date(year, month - 1, 1)
                
                if (rewardDate < new Date(currentYear, currentMonth - 1, 1)) {
                  totalPayroll += reward.amount || 0
                }
              }
            }
          }
        }
      }
    } else {
      // BOARD: Tổng lương đã trả của TẤT CẢ nhân viên (kể cả đã tắt trạng thái hoặc xóa)
      // Tính theo thời gian bắt đầu hợp đồng của mỗi nhân viên + thưởng đến thời điểm hiện tại
      
      // Lấy TẤT CẢ nhân viên (không filter theo status)
      const employees = await prisma.employee.findMany({
        include: {
          contracts: {
            where: { status: 'ACTIVE' },
            orderBy: { startDate: 'desc' },
            take: 1,
          },
        },
      })
      
      // Lấy tất cả thưởng của tất cả nhân viên
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
      
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      
      // Tính tổng lương cho tất cả nhân viên
      for (const emp of employees) {
        // Chỉ tính nếu nhân viên có hợp đồng
        if (emp.contracts.length > 0) {
          const contract = emp.contracts[0]
          const baseSalary = contract.salary || emp.salary || 0
          
          if (baseSalary > 0) {
            const contractStartDate = new Date(contract.startDate)
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
            
            if (completedMonths > 0) {
              // Tính lương cơ bản cho các tháng đã hoàn thành
              let employeeTotal = baseSalary * completedMonths
              
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
                  employeeTotal += bonus
                  
                  currentDate.setMonth(currentDate.getMonth() + 1)
                }
              }
              
              totalPayroll += employeeTotal
            }
          }
        }
      }
    }

    // Tính số nhân viên - Tất cả tài khoản đều thấy giống nhau
    const totalEmployees = await prisma.employee.count({ where: { status: 'ACTIVE' } }).catch(() => 0)

    // Tính số tuyển dụng - Tất cả tài khoản đều thấy giống nhau
    const activeRecruitments = await prisma.jobPosting.count({ where: { status: 'OPEN' } }).catch(() => 0)

    // Tính số nghỉ phép chờ duyệt
    let pendingLeaves = 0
    if (userRole === 'EMPLOYEE' || userRole === 'HR' || userRole === 'MANAGER') {
      // HR, EMPLOYEE, MANAGER: chỉ thấy đơn nghỉ phép của chính họ đang chờ duyệt
      if (userId) {
        const employee = await prisma.employee.findUnique({
          where: { userId },
          select: { id: true },
        })
        if (employee) {
          pendingLeaves = await prisma.leave.count({ 
            where: { 
              employeeId: employee.id,
              status: 'PENDING' 
            } 
          }).catch(() => 0)
        }
      }
    } else {
      // BOARD: thấy tất cả
      pendingLeaves = await prisma.leave.count({ where: { status: 'PENDING' } }).catch(() => 0)
    }

    return {
      totalEmployees,
      activeRecruitments,
      pendingLeaves,
      totalPayroll,
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Return default values if database connection fails
    return {
      totalEmployees: 0,
      activeRecruitments: 0,
      pendingLeaves: 0,
      totalPayroll: 0,
    }
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const stats = await getDashboardStats(session?.user?.id, session?.user?.role)

  const statCards = [
    {
      title: 'Nhân viên',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-blue-500',
      href: '/employees',
    },
    {
      title: 'Tuyển dụng',
      value: stats.activeRecruitments,
      icon: Briefcase,
      color: 'bg-green-500',
      href: '/recruitment',
    },
    {
      title: 'Nghỉ phép chờ duyệt',
      value: stats.pendingLeaves,
      icon: Calendar,
      color: 'bg-yellow-500',
      href: '/leave',
    },
    {
      title: (session?.user?.role === 'EMPLOYEE' || session?.user?.role === 'HR' || session?.user?.role === 'MANAGER') 
        ? 'Tổng lương của tôi' 
        : 'Tổng lương đã trả',
      value: formatCurrency(stats.totalPayroll),
      icon: DollarSign,
      color: 'bg-purple-500',
      href: '/payroll',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Chào mừng, {session?.user?.email}
        </h1>
        <p className="text-gray-600 mt-2">
          Tổng quan hệ thống quản lý nhân sự
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <a
              key={card.title}
              href={card.href}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {card.value}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </a>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Hoạt động gần đây
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Chức năng này đang được phát triển...
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Thống kê nhanh
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Chức năng này đang được phát triển...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

