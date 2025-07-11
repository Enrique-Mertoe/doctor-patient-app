'use client'

import { useState, useEffect } from 'react'
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import AppointmentActions from '../../../components/AppointmentActions'

export default function DoctorSchedule({ user, profile }) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [appointments, setAppointments] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    fetchWeeklyData()
  }, [currentWeek])

  const fetchWeeklyData = async () => {
    setLoading(true)
    try {
      // Fetch appointments for the current week
      const response = await fetch('/api/appointments')
      const data = await response.json()
      
      if (data.appointments) {
        // Filter appointments for current week
        const weekStart = startOfWeek(currentWeek)
        const weekEnd = endOfWeek(currentWeek)
        
        const weekAppointments = data.appointments.filter(apt => {
          if (!apt.time_slots?.date) return false
          const aptDate = new Date(apt.time_slots.date)
          return aptDate >= weekStart && aptDate <= weekEnd
        })
        
        setAppointments(weekAppointments)
      }
    } catch (error) {
      console.error('Error fetching weekly data:', error)
    }
    setLoading(false)
  }

  const handleAppointmentUpdate = (updatedAppointment) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === updatedAppointment.id ? updatedAppointment : apt
      )
    )
  }

  const fetchDaySlots = async (date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const response = await fetch(`/api/time-slots?date=${dateStr}`)
      const data = await response.json()
      setTimeSlots(data.slots || [])
    } catch (error) {
      console.error('Error fetching day slots:', error)
    }
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    fetchDaySlots(date)
  }

  const navigateWeek = (direction) => {
    const newWeek = addDays(currentWeek, direction * 7)
    setCurrentWeek(newWeek)
  }

  const getWeekDays = () => {
    const start = startOfWeek(currentWeek)
    const end = endOfWeek(currentWeek)
    return eachDayOfInterval({ start, end })
  }

  const getAppointmentsForDay = (date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.time_slots.date), date)
    )
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
    return <div className="text-center py-8">Loading schedule...</div>
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <button
          onClick={() => navigateWeek(-1)}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          ← Previous Week
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {format(startOfWeek(currentWeek), 'MMM d')} - {format(endOfWeek(currentWeek), 'MMM d, yyyy')}
        </h2>
        
        <button
          onClick={() => navigateWeek(1)}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Next Week →
        </button>
      </div>

      {/* Weekly Calendar View */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {getWeekDays().map(day => {
          const dayAppointments = getAppointmentsForDay(day)
          const isSelected = isSameDay(day, selectedDate)
          const isToday = isSameDay(day, new Date())
          
          return (
            <div
              key={day.toISOString()}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer transition-colors ${
                isSelected ? 'ring-2 ring-indigo-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleDateSelect(day)}
            >
              <div className="text-center mb-3">
                <div className={`text-sm font-medium ${
                  isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'
                }`}>
                  {format(day, 'EEE')}
                </div>
                <div className={`text-lg font-bold ${
                  isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>
              
              <div className="space-y-1">
                {dayAppointments.length > 0 ? (
                  dayAppointments.slice(0, 3).map(apt => (
                    <div key={apt.id} className="text-xs p-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                      {format(new Date(`2000-01-01T${apt.time_slots.start_time}`), 'h:mm a')} - {apt.patients?.full_name}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 dark:text-gray-500">No appointments</div>
                )}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    +{dayAppointments.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Day Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day Appointments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Appointments for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          
          <div className="space-y-3">
            {getAppointmentsForDay(selectedDate).length > 0 ? (
              getAppointmentsForDay(selectedDate).map(apt => (
                <div key={apt.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {apt.patients?.full_name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {apt.time_slots?.start_time && apt.time_slots?.end_time ? (
                          <>
                            {format(new Date(`2000-01-01T${apt.time_slots.start_time}`), 'h:mm a')} - 
                            {format(new Date(`2000-01-01T${apt.time_slots.end_time}`), 'h:mm a')}
                          </>
                        ) : 'Time unavailable'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <strong>Condition:</strong> {apt.medical_condition}
                  </div>
                  
                  {apt.notes && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <strong>Notes:</strong> {apt.notes}
                    </div>
                  )}
                  
                  <AppointmentActions 
                    appointment={apt} 
                    onUpdate={handleAppointmentUpdate}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No appointments scheduled for this day
              </div>
            )}
          </div>
        </div>

        {/* Time Slots Management */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Time Slots for {format(selectedDate, 'MMM d')}
          </h3>
          
          <div className="space-y-2">
            {timeSlots.length > 0 ? (
              timeSlots.map(slot => (
                <div key={slot.id} className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {slot.display}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {slot.current_bookings}/{slot.max_capacity} booked
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      slot.is_available 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {slot.is_available ? 'Available' : 'Full'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Click on a day to view time slots
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}