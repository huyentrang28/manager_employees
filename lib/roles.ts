export enum UserRole {
  BOARD = 'BOARD',
  HR = 'HR',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  GUEST = 'GUEST',
}

export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

export function canAccessModule(userRole: string, module: string): boolean {
  const permissions: Record<string, string[]> = {
    'recruitment': [UserRole.BOARD, UserRole.HR, UserRole.MANAGER],
    'employees': [UserRole.BOARD, UserRole.HR, UserRole.MANAGER],
    'timekeeping': [UserRole.BOARD, UserRole.HR, UserRole.MANAGER, UserRole.EMPLOYEE],
    'payroll': [UserRole.BOARD, UserRole.HR],
    'performance': [UserRole.BOARD, UserRole.HR, UserRole.MANAGER],
    'training': [UserRole.BOARD, UserRole.HR, UserRole.MANAGER, UserRole.EMPLOYEE],
    'leave': [UserRole.BOARD, UserRole.HR, UserRole.MANAGER, UserRole.EMPLOYEE],
    'reports': [UserRole.BOARD, UserRole.HR, UserRole.MANAGER],
  }

  return permissions[module]?.includes(userRole as UserRole) ?? false
}


