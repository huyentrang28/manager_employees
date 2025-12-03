/**
 * Utility để lazy load icons từ lucide-react
 * Giúp giảm bundle size ban đầu
 */

import { lazy, ComponentType } from 'react'

// Map icon names to their imports
const iconMap: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
  // Layout icons
  LayoutDashboard: () => import('lucide-react').then(m => ({ default: m.LayoutDashboard })),
  Users: () => import('lucide-react').then(m => ({ default: m.Users })),
  Briefcase: () => import('lucide-react').then(m => ({ default: m.Briefcase })),
  Clock: () => import('lucide-react').then(m => ({ default: m.Clock })),
  DollarSign: () => import('lucide-react').then(m => ({ default: m.DollarSign })),
  TrendingUp: () => import('lucide-react').then(m => ({ default: m.TrendingUp })),
  GraduationCap: () => import('lucide-react').then(m => ({ default: m.GraduationCap })),
  Calendar: () => import('lucide-react').then(m => ({ default: m.Calendar })),
  BarChart3: () => import('lucide-react').then(m => ({ default: m.BarChart3 })),
  LogOut: () => import('lucide-react').then(m => ({ default: m.LogOut })),
  FileText: () => import('lucide-react').then(m => ({ default: m.FileText })),
  Shield: () => import('lucide-react').then(m => ({ default: m.Shield })),
  FolderOpen: () => import('lucide-react').then(m => ({ default: m.FolderOpen })),
  
  // Other icons
  Building2: () => import('lucide-react').then(m => ({ default: m.Building2 })),
  MapPin: () => import('lucide-react').then(m => ({ default: m.MapPin })),
  ArrowRight: () => import('lucide-react').then(m => ({ default: m.ArrowRight })),
  LogIn: () => import('lucide-react').then(m => ({ default: m.LogIn })),
  UserPlus: () => import('lucide-react').then(m => ({ default: m.UserPlus })),
  Bell: () => import('lucide-react').then(m => ({ default: m.Bell })),
  Search: () => import('lucide-react').then(m => ({ default: m.Search })),
  X: () => import('lucide-react').then(m => ({ default: m.X })),
  Plus: () => import('lucide-react').then(m => ({ default: m.Plus })),
  Filter: () => import('lucide-react').then(m => ({ default: m.Filter })),
  Edit: () => import('lucide-react').then(m => ({ default: m.Edit })),
  Trash2: () => import('lucide-react').then(m => ({ default: m.Trash2 })),
  Power: () => import('lucide-react').then(m => ({ default: m.Power })),
}

/**
 * Lazy load icon component
 * @param iconName - Name of the icon from lucide-react
 * @returns Lazy loaded icon component
 */
export function lazyIcon(iconName: string) {
  const loader = iconMap[iconName]
  if (!loader) {
    console.warn(`Icon ${iconName} not found in iconMap`)
    return lazy(() => import('lucide-react').then(m => ({ default: m.AlertCircle })))
  }
  return lazy(loader)
}

/**
 * Preload commonly used icons
 */
export function preloadIcons(iconNames: string[]) {
  iconNames.forEach(name => {
    const loader = iconMap[name]
    if (loader) {
      loader()
    }
  })
}

