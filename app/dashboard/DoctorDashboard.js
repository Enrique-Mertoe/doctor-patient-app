"use client"
import { useState, useEffect } from 'react'
import { format } from 'date-fns'

export default function DoctorDashboard({ user, profile }) {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    availableSlots: 0,
    weekAppointments: 0,
    todaySchedule: [],
    recentPatients: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
    setLoading(false)
  }
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dr. {profile.full_name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your appointments and patient care
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Doctor Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">📅</div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Today's Appointments
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {loading ? 'Loading...' : stats.todayAppointments}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">👥</div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Patients
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {loading ? 'Loading...' : stats.totalPatients}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">⏰</div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Available Slots
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {loading ? 'Loading...' : stats.availableSlots}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">📊</div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                This Week
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {loading ? 'Loading...' : stats.weekAppointments}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Today's Schedule
          </h2>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading schedule...</div>
            ) : stats.todaySchedule.length > 0 ? (
              stats.todaySchedule.map((appointment) => (
                <div key={appointment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(`2000-01-01T${appointment.time_slots?.start_time}`), 'h:mm a')} - {appointment.patients?.full_name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {appointment.medical_condition?.substring(0, 50)}...
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">No appointments scheduled for today</div>
            )}
            <div className="mt-4">
              <button 
                onClick={() => window.location.href = '/dashboard/schedule'}
                className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
              >
                View Full Schedule
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Recent Patients
          </h2>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading patients...</div>
            ) : stats.recentPatients.length > 0 ? (
              stats.recentPatients.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-md">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{appointment.patients?.full_name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Last visit: {appointment.time_slots?.date 
                        ? format(new Date(appointment.time_slots.date), 'MMM d, yyyy')
                        : 'Date unavailable'
                      }
                    </div>
                  </div>
                  <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm">
                    View Chart
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">No recent patients</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Schedule Management
          </h2>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="font-medium text-gray-900 dark:text-white">Manage Time Slots</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Set availability and block time</div>
            </button>
            <button className="w-full text-left p-3 rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="font-medium text-gray-900 dark:text-white">Emergency Slots</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Add urgent appointment slots</div>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Patient Care
          </h2>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/dashboard/medical-records'}
              className="w-full text-left p-3 rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="font-medium text-gray-900 dark:text-white">Patient Records</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">View and update medical records</div>
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard/prescriptions'}
              className="w-full text-left p-3 rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="font-medium text-gray-900 dark:text-white">Prescriptions</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Manage medications and refills</div>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Analytics
          </h2>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="font-medium text-gray-900 dark:text-white">Appointment Reports</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">View scheduling analytics</div>
            </button>
            <button className="w-full text-left p-3 rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="font-medium text-gray-900 dark:text-white">Patient Trends</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Analyze patient visit patterns</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}