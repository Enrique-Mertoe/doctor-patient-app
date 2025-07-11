'use client'

import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'

export default function AppointmentBooking({ user, profile }) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [doctors, setDoctors] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [medicalCondition, setMedicalCondition] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchDoctors()
  }, [])

  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      fetchTimeSlots()
    } else {
      setTimeSlots([])
      setSelectedSlot('')
    }
  }, [selectedDate, selectedDoctor])

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors')
      const data = await response.json()
      setDoctors(data.doctors || [])
    } catch (error) {
      console.error('Error fetching doctors:', error)
      setMessage('Error loading doctors')
    }
  }

  const fetchTimeSlots = async () => {
    try {
      const response = await fetch(`/api/time-slots?date=${selectedDate}&doctorId=${selectedDoctor}`)
      const data = await response.json()
      setTimeSlots(data.slots || [])
    } catch (error) {
      console.error('Error fetching time slots:', error)
      setMessage('Error loading time slots')
    }
  }

  const handleBooking = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSlotId: selectedSlot,
          patientData: {
            full_name: profile.full_name,
            email: user.email,
            phone: profile.phone || '',
            date_of_birth: profile.date_of_birth || null
          },
          medicalCondition
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Appointment booked successfully!')
        // Reset form
        setSelectedDate('')
        setSelectedDoctor('')
        setSelectedSlot('')
        setMedicalCondition('')
        setTimeSlots([])
        // Refresh the page after 2 seconds to show updated appointments
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setMessage(data.error || 'Failed to book appointment')
      }
    } catch (error) {
      setMessage('Error booking appointment')
    }
    setLoading(false)
  }

  const generateDateOptions = () => {
    const dates = []
    for (let i = 0; i < 14; i++) {
      const date = addDays(new Date(), i)
      dates.push({
        value: format(date, 'yyyy-MM-dd'),
        label: format(date, 'EEEE, MMMM d, yyyy')
      })
    }
    return dates
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.includes('successfully') 
            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
            : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleBooking} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Doctor</label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="">Choose a doctor</option>
            {doctors.map(doctor => (
              <option key={doctor.id} value={doctor.id}>
                Dr. {doctor.name} - {doctor.specialization}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Date</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
            disabled={!selectedDoctor}
          >
            <option value="">Choose a date</option>
            {generateDateOptions().map(date => (
              <option key={date.value} value={date.value}>{date.label}</option>
            ))}
          </select>
          {!selectedDoctor && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Please select a doctor first</p>
          )}
        </div>

        {selectedDate && selectedDoctor && timeSlots.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No available time slots for this date. Please try another date.
          </div>
        )}

        {timeSlots.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Available Time Slots for Dr. {doctors.find(d => d.id === selectedDoctor)?.name}
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {timeSlots.map(slot => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlot(slot.id)}
                  disabled={!slot.is_available}
                  className={`p-2 text-sm rounded border ${
                    selectedSlot === slot.id
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500'
                      : slot.is_available
                      ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600 cursor-not-allowed'
                  }`}
                >
                  {slot.display}
                  <br />
                  <span className="text-xs">
                    {slot.current_bookings}/{slot.max_capacity} booked
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Booking for: {profile.full_name}
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {user.email} {profile.phone && `• ${profile.phone}`}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Medical Condition/Reason for Visit</label>
          <textarea
            value={medicalCondition}
            onChange={(e) => setMedicalCondition(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Please describe your symptoms or reason for the visit..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !selectedSlot || !selectedDoctor || !selectedDate}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Booking...' : 'Book Appointment'}
        </button>
      </form>
    </div>
  )
}