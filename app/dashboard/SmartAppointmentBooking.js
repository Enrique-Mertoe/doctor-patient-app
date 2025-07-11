'use client'

import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'

export default function SmartAppointmentBooking({ user, profile }) {
  const [medicalCondition, setMedicalCondition] = useState('')
  const [conditionSuggestions, setConditionSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [preferredDate, setPreferredDate] = useState('')
  const [assignedDoctor, setAssignedDoctor] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [slotsByDate, setSlotsByDate] = useState({})
  const [selectedSlot, setSelectedSlot] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Debounced condition search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (medicalCondition.length >= 2) {
        fetchConditionSuggestions()
      } else {
        setConditionSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [medicalCondition])

  const fetchConditionSuggestions = async () => {
    try {
      const response = await fetch(`/api/smart-booking?q=${encodeURIComponent(medicalCondition)}`)
      const data = await response.json()
      setConditionSuggestions(data.suggestions || [])
      setShowSuggestions(true)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    }
  }

  const findBestDoctor = async () => {
    if (!medicalCondition.trim()) {
      setMessage('Please describe your medical condition')
      return
    }

    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/smart-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medical_condition: medicalCondition,
          preferred_date: preferredDate || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        setAssignedDoctor(data.assigned_doctor)
        setAvailableSlots(data.available_slots)
        setSlotsByDate(data.slots_by_date)
        setMessage(data.message)
        
        // Auto-select first available date
        const firstDate = Object.keys(data.slots_by_date)[0]
        if (firstDate) {
          setSelectedDate(firstDate)
        }
      } else {
        setMessage(data.error || 'Failed to find a suitable doctor')
        setAssignedDoctor(null)
        setAvailableSlots([])
        setSlotsByDate({})
      }
    } catch (error) {
      console.error('Error finding doctor:', error)
      setMessage('Error finding a suitable doctor')
    }
    
    setLoading(false)
  }

  const bookAppointment = async () => {
    if (!selectedSlot) {
      setMessage('Please select a time slot')
      return
    }

    setBookingLoading(true)
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
        setMedicalCondition('')
        setPreferredDate('')
        setAssignedDoctor(null)
        setAvailableSlots([])
        setSlotsByDate({})
        setSelectedSlot('')
        setSelectedDate('')
        // Refresh the page after 2 seconds
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setMessage(data.error || 'Failed to book appointment')
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
      setMessage('Error booking appointment')
    }
    setBookingLoading(false)
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

  const selectConditionSuggestion = (suggestion) => {
    setMedicalCondition(suggestion)
    setShowSuggestions(false)
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.includes('successfully') 
            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
            : message.includes('found') && assignedDoctor
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
            : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
        }`}>
          {message}
        </div>
      )}

      {/* Step 1: Describe condition */}
      <div className="space-y-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What's your medical condition or reason for visit?
          </label>
          <textarea
            value={medicalCondition}
            onChange={(e) => setMedicalCondition(e.target.value)}
            onFocus={() => setShowSuggestions(conditionSuggestions.length > 0)}
            placeholder="Describe your symptoms or condition (e.g., 'chest pain', 'skin rash', 'routine checkup')"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            rows={3}
            required
          />
          
          {/* Condition Suggestions */}
          {showSuggestions && conditionSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {conditionSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectConditionSuggestion(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preferred Date (Optional)
          </label>
          <select
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Any date (recommended)</option>
            {generateDateOptions().map(date => (
              <option key={date.value} value={date.value}>{date.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Leave empty for fastest appointment availability
          </p>
        </div>

        <button
          onClick={findBestDoctor}
          disabled={loading || !medicalCondition.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium transition-colors"
        >
          {loading ? 'Finding Best Doctor...' : 'Find Best Doctor for My Condition'}
        </button>
      </div>

      {/* Step 2: Doctor Assignment Result */}
      {assignedDoctor && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
            🎯 Smart Match Found!
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-400">
            <p><strong>Doctor:</strong> {assignedDoctor.name}</p>
            <p><strong>Why this doctor:</strong> {assignedDoctor.match_reason}</p>
            <p className="mt-2 text-xs">
              Our system analyzed your condition and found the best specialist available for your needs.
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Available Slots */}
      {Object.keys(slotsByDate).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Available Appointments
          </h3>
          
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value)
                setSelectedSlot('') // Reset slot selection when date changes
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Choose a date</option>
              {Object.keys(slotsByDate).map(date => (
                <option key={date} value={date}>
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')} ({slotsByDate[date].length} slots available)
                </option>
              ))}
            </select>
          </div>

          {/* Time Slots */}
          {selectedDate && slotsByDate[selectedDate] && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Available Time Slots
              </label>
              <div className="grid grid-cols-2 gap-2">
                {slotsByDate[selectedDate].map(slot => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlot(slot.id)}
                    disabled={!slot.is_available}
                    className={`p-3 text-sm rounded border ${
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

          {/* Patient Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Booking for: {profile.full_name}
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {user.email} {profile.phone && `• ${profile.phone}`}
            </p>
          </div>

          {/* Book Button */}
          <button
            onClick={bookAppointment}
            disabled={bookingLoading || !selectedSlot}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            {bookingLoading ? 'Booking...' : 'Confirm Appointment'}
          </button>
        </div>
      )}
    </div>
  )
}