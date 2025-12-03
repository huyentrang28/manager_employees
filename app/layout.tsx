import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClientRoot } from './ClientRoot'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HRMS - Human Resource Management System',
  description: 'Online Human Resource Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  )
}

