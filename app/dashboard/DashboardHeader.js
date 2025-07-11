'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardHeader({ user, profile }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/')
    setLoading(false)
  }

  const getRoleDisplay = () => {
    if (profile?.role === 'doctor') {
      return {
        title: 'Medical Portal - Doctor',
        badge: 'Doctor',
        badgeColor: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
      }
    } else if (profile?.role === 'patient') {
      return {
        title: 'Medical Portal - Patient',
        badge: 'Patient', 
        badgeColor: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
      }
    }
    return {
      title: 'Medical Portal',
      badge: null,
      badgeColor: ''
    }
  }

  const roleInfo = getRoleDisplay()

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {roleInfo.title}
            </h1>
            {roleInfo.badge && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleInfo.badgeColor}`}>
                {roleInfo.badge}
              </span>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left">
                <div className="text-gray-700 dark:text-gray-300 font-medium">
                  {profile?.full_name || user.email}
                </div>
                {profile?.full_name && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </div>
                )}
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                <Link
                  href="/dashboard/profile"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  Profile Settings
                </Link>
                {profile?.role === 'doctor' && (
                  <Link
                    href="/dashboard/schedule"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Manage Schedule
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  {loading ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}