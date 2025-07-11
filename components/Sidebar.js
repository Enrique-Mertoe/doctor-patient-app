'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, 
  Calendar, 
  FileText, 
  Pill, 
  User, 
  Users, 
  CalendarDays,
  Heart,
  Menu,
  X
} from 'lucide-react'

export default function Sidebar({ user, profile }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  const patientNavItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      description: 'Overview'
    },
    {
      name: 'Appointments',
      href: '/dashboard/appointments',
      icon: Calendar,
      description: 'Schedule'
    },
    {
      name: 'Medical Records',
      href: '/dashboard/medical-records',
      icon: FileText,
      description: 'Records'
    },
    {
      name: 'Prescriptions',
      href: '/dashboard/prescriptions',
      icon: Pill,
      description: 'Medicines'
    },
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: User,
      description: 'Account'
    }
  ]

  const doctorNavItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      description: 'Overview'
    },
    {
      name: 'Schedule',
      href: '/dashboard/schedule',
      icon: CalendarDays,
      description: 'Calendar'
    },
    {
      name: 'Patients',
      href: '/dashboard/medical-records',
      icon: Users,
      description: 'Records'
    },
    {
      name: 'Prescriptions',
      href: '/dashboard/prescriptions',
      icon: Pill,
      description: 'Medicines'
    },
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: User,
      description: 'Account'
    }
  ]

  const navItems = profile?.role === 'doctor' ? doctorNavItems : patientNavItems

  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo/Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-gray-900 dark:text-white">MedCare</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{profile?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-2">
        {navItems.map((item) => {
          const IconComponent = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center p-3 rounded-lg transition-all duration-200 group
                ${isActive(item.href)
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }
              `}
              onClick={() => setIsMobileOpen(false)}
            >
              <div className={`
                mb-1 transition-transform duration-200 group-hover:scale-110
                ${isActive(item.href) ? 'scale-110' : ''}
              `}>
                <IconComponent className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-center leading-tight">
                {item.description}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-full">
              {profile?.full_name?.split(' ')[0] || 'User'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        {isMobileOpen ? (
          <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-20 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:dark:border-gray-700 lg:bg-white lg:dark:bg-gray-900">
        <SidebarContent />
      </div>

      {/* Mobile Drawer */}
      <div className={`
        lg:hidden fixed inset-y-0 left-0 z-50 w-20 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </div>
    </>
  )
}