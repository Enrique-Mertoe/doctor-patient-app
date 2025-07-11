'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

export default function AppointmentHistory() {
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
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'no_show': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-4 text-gray-900 dark:text-white">Loading appointments...</div>
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No appointments found. Book your first appointment!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {appointments.map(appointment => (
        <div key={appointment.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                Dr. {appointment.doctors.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {appointment.doctors.specialization}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
              {appointment.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Date & Time</p>
              <p className="text-gray-600 dark:text-gray-400">
                {format(new Date(appointment.time_slots.date), 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {format(new Date(`2000-01-01T${appointment.time_slots.start_time}`), 'h:mm a')} - 
                {format(new Date(`2000-01-01T${appointment.time_slots.end_time}`), 'h:mm a')}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Booked On</p>
              <p className="text-gray-600 dark:text-gray-400">
                {format(new Date(appointment.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>
          
          <div className="mt-3">
            <p className="font-medium text-sm text-gray-900 dark:text-white">Medical Condition</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {appointment.medical_condition}
            </p>
          </div>
          
          {appointment.notes && (
            <div className="mt-3">
              <p className="font-medium text-sm text-gray-900 dark:text-white">Doctor's Notes</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {appointment.notes}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}