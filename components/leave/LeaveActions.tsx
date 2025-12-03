'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Check, X } from 'lucide-react'

interface LeaveActionsProps {
  leaveId: string
}

export function LeaveActions({ leaveId }: LeaveActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const handleApprove = async () => {
    setLoading('approve')
    try {
      const response = await fetch(`/api/leave/${leaveId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })

      if (!response.ok) {
        throw new Error('Có lỗi xảy ra')
      }

      router.refresh()
    } catch (error) {
      alert('Có lỗi xảy ra khi duyệt đơn nghỉ phép')
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối')
      return
    }

    setLoading('reject')
    try {
      const response = await fetch(`/api/leave/${leaveId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionReason,
        }),
      })

      if (!response.ok) {
        throw new Error('Có lỗi xảy ra')
      }

      router.refresh()
    } catch (error) {
      alert('Có lỗi xảy ra khi từ chối đơn nghỉ phép')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {!showRejectForm ? (
        <>
          <Button
            onClick={handleApprove}
            disabled={loading !== null}
            className="w-full"
          >
            <Check className="h-4 w-4 mr-2" />
            {loading === 'approve' ? 'Đang duyệt...' : 'Duyệt đơn'}
          </Button>
          <Button
            onClick={() => setShowRejectForm(true)}
            variant="danger"
            disabled={loading !== null}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Từ chối
          </Button>
        </>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do từ chối
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Nhập lý do từ chối..."
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleReject}
              variant="danger"
              disabled={loading !== null}
              className="flex-1"
            >
              {loading === 'reject' ? 'Đang từ chối...' : 'Xác nhận từ chối'}
            </Button>
            <Button
              onClick={() => {
                setShowRejectForm(false)
                setRejectionReason('')
              }}
              variant="outline"
              disabled={loading !== null}
            >
              Hủy
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}








