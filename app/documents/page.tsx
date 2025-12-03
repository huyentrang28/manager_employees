'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, File, Download, Trash2, Eye } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Document {
  id: string
  name: string
  type: string
  filePath: string
  description: string | null
  accessLevel: string
  uploadedAt: string
  employee: {
    firstName: string
    lastName: string
    employeeId: string
  }
}

export default function DocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchDocuments()
      }
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  const filteredDocuments = filter
    ? documents.filter((doc) => doc.type === filter)
    : documents

  if (loading) {
    return <div className="p-6">Đang tải...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Tài liệu</h1>
          <p className="text-gray-600 mt-2">Lưu trữ và quản lý tài liệu nhân viên</p>
        </div>
        <Button onClick={() => router.push('/documents/upload')}>
          <Plus className="h-4 w-4 mr-2" />
          Tải lên tài liệu
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === '' ? 'primary' : 'outline'}
          onClick={() => setFilter('')}
        >
          Tất cả
        </Button>
        <Button
          variant={filter === 'CV' ? 'primary' : 'outline'}
          onClick={() => setFilter('CV')}
        >
          CV
        </Button>
        <Button
          variant={filter === 'CERTIFICATE' ? 'primary' : 'outline'}
          onClick={() => setFilter('CERTIFICATE')}
        >
          Chứng chỉ
        </Button>
        <Button
          variant={filter === 'CONTRACT' ? 'primary' : 'outline'}
          onClick={() => setFilter('CONTRACT')}
        >
          Hợp đồng
        </Button>
        <Button
          variant={filter === 'ID_CARD' ? 'primary' : 'outline'}
          onClick={() => setFilter('ID_CARD')}
        >
          CMND/CCCD
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredDocuments.length === 0 ? (
          <Card className="p-6 text-center">
            <File className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Chưa có tài liệu nào</p>
          </Card>
        ) : (
          filteredDocuments.map((doc) => (
            <Card key={doc.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <File className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-semibold">{doc.name}</h3>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {doc.type}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {doc.accessLevel}
                    </span>
                  </div>
                  {doc.description && (
                    <p className="text-gray-600 mb-2">{doc.description}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {doc.employee.firstName} {doc.employee.lastName} • 
                    {new Date(doc.uploadedAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(doc.filePath, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Xem
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(doc.filePath, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Tải
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}






