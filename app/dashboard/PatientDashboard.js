"use client"
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import AppointmentBooking from './AppointmentBooking'
import AppointmentHistory from './AppointmentHistory'
import ChatWidget from '../../components/ChatWidget'

export default function PatientDashboard({ user, profile }) {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    nextAppointment: null,
    recentAppointments: [],
    primaryDoctor: 'Loading...'
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
          Welcome back, {profile.full_name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your medical appointments and health records
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">📅</div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Next Appointment
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {loading ? 'Loading...' : stats.nextAppointment 
                  ? format(new Date(stats.nextAppointment.time_slots.date), 'MMM d')
                  : 'None scheduled'
                }
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">📋</div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Appointments
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {loading ? 'Loading...' : stats.totalAppointments}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">👨‍⚕️</div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Most Recent Doctor
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {loading ? 'Loading...' : stats.primaryDoctor || 'No visits yet'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Book New Appointment
          </h2>
          <AppointmentBooking user={user} profile={profile} />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Your Appointments
          </h2>
          <AppointmentHistory user={user} profile={profile} />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Health Summary
          </h2>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading health summary...</div>
            ) : (
              <>
                {stats.recentAppointments && stats.recentAppointments.length > 0 ? (
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Recent Visits</h3>
                    {stats.recentAppointments.slice(0, 2).map((appointment) => (
                      <p key={appointment.id} className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(appointment.time_slots.date), 'MMM d, yyyy')}: {appointment.medical_condition.substring(0, 40)}...
                      </p>
                    ))}
                  </div>
                ) : (
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Recent Visits</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No recent visits. Book your first appointment to get started!
                    </p>
                  </div>
                )}
                
                {stats.nextAppointment ? (
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Upcoming</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Next appointment: {format(new Date(stats.nextAppointment.time_slots.date), 'MMM d, yyyy')} at {format(new Date(`2000-01-01T${stats.nextAppointment.time_slots.start_time}`), 'h:mm a')}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Upcoming</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No upcoming appointments scheduled
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-full text-left p-3 rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-white">Book New Appointment</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Schedule your next visit</div>
            </button>
            
            <button 
              onClick={() => window.location.href = '/dashboard/medical-records'}
              className="w-full text-left p-3 rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-white">View Medical Records</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Access your health history</div>
            </button>
            
            <button 
              onClick={() => window.location.href = '/dashboard/prescriptions'}
              className="w-full text-left p-3 rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-white">Prescription Refills</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Request medication refills</div>
            </button>
            
            <button 
              onClick={() => alert('Use the chat widget in the bottom-right corner to message your healthcare provider!')}
              className="w-full text-left p-3 rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-white">Contact Doctor</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Send a message to your healthcare provider</div>
            </button>
          </div>
        </div>
      </div>
      
      <ChatWidget user={user} profile={profile} />
    </div>
  )
}