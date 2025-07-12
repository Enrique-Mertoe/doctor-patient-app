'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

export default function AppointmentPreview({ user, profile }) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments')
      const data = await response.json()
      setAppointments(data.appointments || [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
    }
    setLoading(false)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'no_show': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (loading) {
    return <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading appointments...</div>
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <div className="text-4xl mb-2">📅</div>
        <p className="mb-2">No appointments found</p>
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm"
        >
          Book your first appointment
        </button>
      </div>
    )
  }

  // Show only the first 2 appointments
  const previewAppointments = appointments.slice(0, 2)

  return (
    <div className="space-y-4">
      {previewAppointments.map(appointment => (
        <div key={appointment.id} className="border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Dr. {appointment.doctors?.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {appointment.doctors?.specialization}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
              {appointment.status.toUpperCase()}
            </span>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <div className="flex items-center space-x-4">
              <span>
                📅 {appointment.time_slots?.date 
                  ? format(new Date(appointment.time_slots.date), 'MMM d, yyyy')
                  : 'Date unavailable'
                }
              </span>
              <span>
                ⏰ {appointment.time_slots?.start_time 
                  ? format(new Date(`2000-01-01T${appointment.time_slots.start_time}`), 'h:mm a')
                  : 'Time unavailable'
                }
              </span>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Condition:</strong> {appointment.medical_condition || 'Not specified'}
          </div>
        </div>
      ))}
      
      {/* View All Button */}
      <div className="pt-2">
        <button
          onClick={() => window.location.href = '/dashboard/appointments'}
          className="w-full text-center py-2 px-4 border border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
        >
          View All Appointments ({appointments.length})
        </button>
      </div>
    </div>
  )
}