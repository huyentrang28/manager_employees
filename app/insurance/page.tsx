'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Shield, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Insurance {
  id: string
  insuranceType: string
  policyNumber: string | null
  provider: string | null
  startDate: string
  endDate: string | null
  premium: number | null
  status: string
  employee: {
    firstName: string
    lastName: string
    employeeId: string
  }
}

export default function InsurancePage() {
  const router = useRouter()
  const [insurances, setInsurances] = useState<Insurance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInsurances()
  }, [])

  const fetchInsurances = async () => {
    try {
      const response = await fetch('/api/insurance')
      if (response.ok) {
        const data = await response.json()
        setInsurances(data)
      }
    } catch (error) {
      console.error('Error fetching insurance records:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'EXPIRED':
        return 'bg-red-100 text-red-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      HEALTH: 'Bảo hiểm Y tế',
      SOCIAL: 'Bảo hiểm Xã hội',
      UNEMPLOYMENT: 'Bảo hiểm Thất nghiệp',
    }
    return labels[type] || type
  }

  if (loading) {
    return <div className="p-6">Đang tải...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Bảo hiểm</h1>
          <p className="text-gray-600 mt-2">Theo dõi và quản lý bảo hiểm nhân viên</p>
        </div>
        <Button onClick={() => router.push('/insurance/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm bảo hiểm
        </Button>
      </div>

      <div className="grid gap-4">
        {insurances.length === 0 ? (
          <Card className="p-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Chưa có bảo hiểm nào</p>
          </Card>
        ) : (
          insurances.map((insurance) => (
            <Card key={insurance.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">
                      {getTypeLabel(insurance.insuranceType)}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(insurance.status)}`}>
                      {insurance.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">
                    {insurance.employee.firstName} {insurance.employee.lastName} ({insurance.employee.employeeId})
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                    {insurance.policyNumber && (
                      <div>
                        <span className="font-medium">Số hợp đồng:</span> {insurance.policyNumber}
                      </div>
                    )}
                    {insurance.provider && (
                      <div>
                        <span className="font-medium">Nhà cung cấp:</span> {insurance.provider}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Bắt đầu:</span>{' '}
                      {new Date(insurance.startDate).toLocaleDateString('vi-VN')}
                    </div>
                    {insurance.endDate && (
                      <div>
                        <span className="font-medium">Kết thúc:</span>{' '}
                        {new Date(insurance.endDate).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                    {insurance.premium && (
                      <div>
                        <span className="font-medium">Phí bảo hiểm:</span>{' '}
                        {insurance.premium.toLocaleString('vi-VN')} VNĐ
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/insurance/${insurance.id}`)}
                >
                  Xem chi tiết
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}






