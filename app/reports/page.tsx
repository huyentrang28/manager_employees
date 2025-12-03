import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react'

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  // Only Board, HR, and Managers can access reports
  if (session.user.role === 'EMPLOYEE') {
    redirect('/dashboard')
  }

  const reportCategories = [
    {
      title: 'Báo cáo Nhân sự',
      description: 'Thống kê về nhân viên, tuyển dụng, và biến động nhân sự',
      icon: Users,
      href: '/reports/employees',
      color: 'bg-blue-500',
    },
    {
      title: 'Báo cáo Lương thưởng',
      description: 'Phân tích chi phí lương, thưởng và các khoản phụ cấp',
      icon: DollarSign,
      href: '/reports/payroll',
      color: 'bg-green-500',
    },
    {
      title: 'Báo cáo Hiệu suất',
      description: 'Đánh giá hiệu suất làm việc và KPI của nhân viên',
      icon: TrendingUp,
      href: '/reports/performance',
      color: 'bg-purple-500',
    },
    {
      title: 'Báo cáo Tổng hợp',
      description: 'Báo cáo tổng hợp và phân tích đa chiều',
      icon: BarChart3,
      href: '/reports/overview',
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Báo cáo & Phân tích</h1>
        <p className="text-gray-600 mt-2">
          Xem và phân tích dữ liệu nhân sự
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCategories.map((category) => {
          const Icon = category.icon
          return (
            <a
              key={category.title}
              href={category.href}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`${category.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {category.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {category.description}
                  </p>
                </div>
              </div>
            </a>
          )
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Báo cáo nhanh
        </h2>
        <p className="text-sm text-gray-500">
          Chức năng báo cáo chi tiết đang được phát triển...
        </p>
      </div>
    </div>
  )
}







