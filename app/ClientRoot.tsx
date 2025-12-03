'use client'

import React from 'react'
import { SessionProvider } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function ClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </SessionProvider>
    </ErrorBoundary>
  )
}

