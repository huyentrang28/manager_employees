import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Public routes (guest can access)
    const publicRoutes = ['/login', '/register', '/about']
    const isPublicRoute = publicRoutes.includes(path) || path === '/' || path.startsWith('/jobs/')
    
    if (isPublicRoute) {
      // If user is logged in and tries to access login/register, redirect based on role
      if (token && (path === '/login' || path === '/register')) {
        const role = token.role as string
        // GUEST redirect về trang chủ, các role khác redirect về dashboard
        if (role === 'GUEST') {
          return NextResponse.redirect(new URL('/', req.url))
        } else {
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      }
      return NextResponse.next()
    }

    // Protected routes
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Role-based access control
    const role = token.role as string

    // GUEST chỉ có thể truy cập trang chủ và apply công việc
    if (role === 'GUEST') {
      // Cho phép GUEST truy cập trang chủ và các trang công việc
      if (path === '/' || path.startsWith('/jobs/')) {
        return NextResponse.next()
      }
      // Chặn GUEST truy cập các trang HRMS bên trong
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Payroll - only HR, Board, and Employee (for their own records)
    if (path.startsWith('/payroll') && role !== 'HR' && role !== 'BOARD' && role !== 'EMPLOYEE') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Reports - only Board, HR, and Managers
    if (path.startsWith('/reports') && role === 'EMPLOYEE') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Contracts management - only HR and Board can create/edit
    if ((path.startsWith('/contracts/new') || path.match(/\/contracts\/[^/]+\/edit/)) && role !== 'HR' && role !== 'BOARD') {
      return NextResponse.redirect(new URL('/contracts', req.url))
    }

    // Employees management - only HR and Board can create/edit/view detail
    if (
      (path.startsWith('/employees/new') || 
       path.match(/\/employees\/[^/]+\/edit/) ||
       path.match(/\/employees\/[^/]+$/)) && 
      role !== 'HR' && role !== 'BOARD'
    ) {
      return NextResponse.redirect(new URL('/employees', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        
        // Allow access to public pages
        const publicRoutes = ['/login', '/register', '/about']
        if (publicRoutes.includes(path) || path === '/' || path.startsWith('/jobs/')) {
          return true
        }
        
        // Require authentication for other routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}





