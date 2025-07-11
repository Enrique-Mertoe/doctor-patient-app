'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield, 
  Users, 
  UserPlus, 
  Calendar, 
  Activity, 
  Settings, 
  Database,
  BarChart3,
  FileText,
  Clock
} from 'lucide-react'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [hasAdminAccess, setHasAdminAccess] = useState(false)
  const [stats, setStats] = useState({})
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
    fetchStats()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Check if user has admin permissions
      const response = await fetch('/api/admin/check-access')
      const data = await response.json()
      
      if (!data.hasAccess) {
        router.push('/dashboard')
        return
      }

      setHasAdminAccess(true)
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">System Administration Panel</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Back to Dashboard
              </Link>
              <div className="flex items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
                  {user?.email}
                </span>
                <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.totalUsers || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <UserPlus className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Doctors</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.activeDoctors || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Appointments</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.todayAppointments || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Status</p>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                  Online
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management */}
          <Link href="/admin/users" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage user accounts and permissions</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                  View Users →
                </span>
              </div>
            </div>
          </Link>

          {/* Doctor Management */}
          <Link href="/admin/doctors" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                  <UserPlus className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Doctor Management</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Add and manage doctor profiles</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                  Manage Doctors →
                </span>
              </div>
            </div>
          </Link>

          {/* Appointments Overview */}
          <Link href="/admin/appointments" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                  <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appointments</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">View and manage all appointments</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                  View Appointments →
                </span>
              </div>
            </div>
          </Link>

          {/* System Reports */}
          <Link href="/admin/reports" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900 group-hover:bg-orange-200 dark:group-hover:bg-orange-800 transition-colors">
                  <BarChart3 className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reports & Analytics</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">View system reports and analytics</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                  View Reports →
                </span>
              </div>
            </div>
          </Link>

          {/* System Settings */}
          <Link href="/admin/settings" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                  <Settings className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Settings</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Configure system settings</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                  Settings →
                </span>
              </div>
            </div>
          </Link>

          {/* Database Management */}
          <Link href="/admin/database" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900 group-hover:bg-red-200 dark:group-hover:bg-red-800 transition-colors">
                  <Database className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Database</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Database backup and maintenance</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                  Manage DB →
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600 dark:text-gray-400">New user registration - 2 minutes ago</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-600 dark:text-gray-400">Appointment booked - 15 minutes ago</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-600 dark:text-gray-400">Doctor schedule updated - 1 hour ago</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <span className="text-gray-600 dark:text-gray-400">System backup completed - 3 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}