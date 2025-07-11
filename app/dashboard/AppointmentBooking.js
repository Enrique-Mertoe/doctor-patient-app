'use client'

import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'

export default function AppointmentBooking() {
  const [selectedDate, setSelectedDate] = useState('')
  const [timeSlots, setTimeSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [patientData, setPatientData] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: ''
  })
  const [medicalCondition, setMedicalCondition] = useState('')
  const [loading, setLoading] = useState(false)

  const doctorId = '00000000-0000-0000-0000-000000000000' // Replace with actual doctor ID

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots()
    }
  }, [selectedDate])

  const fetchTimeSlots = async () => {
    try {
      const response = await fetch(`/api/time-slots?date=${selectedDate}&doctorId=${doctorId}`)
      const data = await response.json()
      setTimeSlots(data.slots || [])
    } catch (error) {
      console.error('Error fetching time slots:', error)
    }
  }

  const handleBooking = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSlotId: selectedSlot,
          patientData,
          medicalCondition
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Appointment booked successfully!')
        // Reset form
        setSelectedDate('')
        setSelectedSlot('')
        setPatientData({ full_name: '', email: '', phone: '', date_of_birth: '' })
        setMedicalCondition('')
        setTimeSlots([])
      } else {
        alert(data.error || 'Failed to book appointment')
      }
    } catch (error) {
      alert('Error booking appointment')
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
    <form onSubmit={handleBooking} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Date</label>
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        >
          <option value="">Choose a date</option>
          {generateDateOptions().map(date => (
            <option key={date.value} value={date.value}>{date.label}</option>
          ))}
        </select>
      </div>

      {timeSlots.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Available Time Slots</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {timeSlots.map(slot => (
              <button
                key={slot.start_time}
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
          <input
            type="text"
            value={patientData.full_name}
            onChange={(e) => setPatientData({...patientData, full_name: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            value={patientData.email}
            onChange={(e) => setPatientData({...patientData, email: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
          <input
            type="tel"
            value={patientData.phone}
            onChange={(e) => setPatientData({...patientData, phone: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
          <input
            type="date"
            value={patientData.date_of_birth}
            onChange={(e) => setPatientData({...patientData, date_of_birth: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
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
        disabled={loading || !selectedSlot}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Booking...' : 'Book Appointment'}
      </button>
    </form>
  )
}