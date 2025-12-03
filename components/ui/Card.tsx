import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
}

export function Card({ children, className, title }: CardProps) {
  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {title && (
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className={title ? 'p-6' : 'p-4'}>{children}</div>
    </div>
  )
}








