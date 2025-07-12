'use client'

import { useState } from 'react'

export default function AppointmentActions({ appointment, onUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [notes, setNotes] = useState(appointment.notes || '')

  const updateAppointmentStatus = async (newStatus, appointmentNotes = '') => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: appointmentNotes || appointment.notes
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        if (onUpdate) onUpdate(data.appointment)
        if (showNotesModal) setShowNotesModal(false)
      } else {
        alert(data.error || 'Failed to update appointment')
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      alert('Failed to update appointment')
    }
    setIsUpdating(false)
  }

  const cancelAppointment = async () => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      await updateAppointmentStatus('cancelled')
    }
  }

  const completeAppointment = () => {
    setShowNotesModal(true)
  }

  const handleCompleteWithNotes = () => {
    updateAppointmentStatus('completed', notes)
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

  return (
    <>
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
          {appointment.status.replace('_', ' ').toUpperCase()}
        </span>
        
        {appointment.status === 'scheduled' && (
          <div className="flex space-x-2">
            <button
              onClick={completeAppointment}
              disabled={isUpdating}
              className="text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-2 py-1 rounded transition-colors"
            >
              {isUpdating ? '...' : 'Complete'}
            </button>
            <button
              onClick={() => updateAppointmentStatus('no_show')}
              disabled={isUpdating}
              className="text-xs bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-2 py-1 rounded transition-colors"
            >
              No Show
            </button>
            <button
              onClick={cancelAppointment}
              disabled={isUpdating}
              className="text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-2 py-1 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Complete Appointment
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Patient: {appointment.patients?.full_name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Condition: {appointment.medical_condition}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Appointment Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about the appointment, treatment provided, recommendations, etc..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteWithNotes}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {isUpdating ? 'Completing...' : 'Complete Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}