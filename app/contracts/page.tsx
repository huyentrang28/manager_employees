'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Plus, FileText, Calendar, AlertCircle, Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Contract {
  id: string
  contractNumber: string
  contractType: string
  startDate: string
  endDate: string | null
  isIndefinite: boolean
  status: string
  employee: {
    firstName: string
    lastName: string
    employeeId: string
    user?: {
      email: string
    }
  }
}

export default function ContractsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [showExpiring, setShowExpiring] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  
  // Chỉ HR và BOARD mới có quyền thêm/sửa/xóa
  const canManage = session?.user?.role === 'HR' || session?.user?.role === 'BOARD'

  useEffect(() => {
    fetchContracts()
  }, [showExpiring, search, status])

  const fetchContracts = async () => {
    try {
      const params = new URLSearchParams()
      if (showExpiring) params.append('expiringSoon', 'true')
      if (search) params.append('search', search)
      if (status) params.append('status', status)

      const response = await fetch(`/api/contracts?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setContracts(data)
      } else {
        console.error('Error fetching contracts:', response.status, await response.text())
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
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
      case 'TERMINATED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isExpiringSoon = (endDate: string | null) => {
    if (!endDate) return false
    const end = new Date(endDate)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  if (loading) {
    return <div className="p-6">Đang tải...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Hợp đồng Lao động</h1>
          <p className="text-gray-600 mt-2">Theo dõi và quản lý hợp đồng lao động</p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button
              onClick={() => setShowExpiring(!showExpiring)}
              variant={showExpiring ? 'primary' : 'outline'}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              {showExpiring ? 'Tất cả' : 'Sắp hết hạn'}
            </Button>
          )}
          {canManage && (
            <Button onClick={() => router.push('/contracts/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm hợp đồng
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo số hợp đồng, tên nhân viên, mã NV..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="EXPIRED">Đã hết hạn</option>
            <option value="TERMINATED">Đã chấm dứt</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {contracts.length === 0 ? (
          <Card className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Chưa có hợp đồng nào</p>
          </Card>
        ) : (
          contracts.map((contract) => (
            <Card key={contract.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {contract.contractNumber}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(contract.status)}`}>
                      {contract.status}
                    </span>
                    {isExpiringSoon(contract.endDate) && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Sắp hết hạn
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">
                    {contract.employee.firstName} {contract.employee.lastName} ({contract.employee.employeeId})
                  </p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Loại: {contract.contractType}</span>
                    </div>
                    <div>
                      Bắt đầu: {new Date(contract.startDate).toLocaleDateString('vi-VN')}
                    </div>
                    {contract.endDate && (
                      <div>
                        Kết thúc: {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                    {contract.isIndefinite && (
                      <div className="text-blue-600">Không xác định thời hạn</div>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/contracts/${contract.id}`)}
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



