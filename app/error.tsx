'use client'

import React from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Đã xảy ra lỗi</h2>
        <p className="text-gray-600 mb-4">
          {error.message || 'Có lỗi xảy ra khi tải trang'}
        </p>
        <button
          onClick={reset}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Thử lại
        </button>
      </div>
    </div>
  )
}

