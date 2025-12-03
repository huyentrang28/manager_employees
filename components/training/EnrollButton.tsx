'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface EnrollButtonProps {
  programId: string
  disabled?: boolean
  alreadyEnrolled?: boolean
}

export function EnrollButton({ programId, disabled, alreadyEnrolled }: EnrollButtonProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleEnroll = async () => {
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/training/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainingProgramId: programId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Không thể đăng ký chương trình')
      }

      setSuccess(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi đăng ký')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}
      <Button
        type="button"
        onClick={handleEnroll}
        disabled={disabled || alreadyEnrolled || success || loading}
        className="w-full"
      >
        {alreadyEnrolled || success ? 'Đã đăng ký' : loading ? 'Đang đăng ký...' : 'Đăng ký tham gia'}
      </Button>
    </div>
  )
}








