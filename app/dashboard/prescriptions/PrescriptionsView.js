'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

export default function PrescriptionsView({ user, profile }) {
  const [prescriptions, setPrescriptions] = useState([])
  const [refillRequests, setRefillRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('prescriptions')
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [refillForm, setRefillForm] = useState({
    pharmacy_info: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [prescriptionsRes, refillRequestsRes] = await Promise.all([
        fetch('/api/prescriptions'),
        fetch('/api/prescription-refills')
      ])

      const prescriptionsData = await prescriptionsRes.json()
      const refillRequestsData = await refillRequestsRes.json()

      if (prescriptionsData.prescriptions) {
        setPrescriptions(prescriptionsData.prescriptions)
      }
      if (refillRequestsData.refillRequests) {
        setRefillRequests(refillRequestsData.refillRequests)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }

  const handleRefillRequest = async (prescription) => {
    setSelectedPrescription(prescription)
  }

  const submitRefillRequest = async () => {
    try {
      const response = await fetch('/api/prescription-refills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prescription_id: selectedPrescription.id,
          pharmacy_info: refillForm.pharmacy_info,
          notes: refillForm.notes
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        alert('Refill request submitted successfully!')
        setSelectedPrescription(null)
        setRefillForm({ pharmacy_info: '', notes: '' })
        fetchData() // Refresh data
      } else {
        alert(data.error || 'Failed to submit refill request')
      }
    } catch (error) {
      console.error('Error submitting refill request:', error)
      alert('Failed to submit refill request')
    }
  }

  const handleRefillResponse = async (refillRequestId, status, response) => {
    try {
      const res = await fetch('/api/prescription-refills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refill_request_id: refillRequestId,
          status,
          doctor_response: response
        })
      })

      if (res.ok) {
        alert(`Refill request ${status} successfully!`)
        fetchData() // Refresh data
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update refill request')
      }
    } catch (error) {
      console.error('Error updating refill request:', error)
      alert('Failed to update refill request')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'denied': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading prescriptions...</div>
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-600">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'prescriptions'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Prescriptions ({prescriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('refills')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'refills'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Refill Requests ({refillRequests.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              {prescriptions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">💊</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No prescriptions found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Prescriptions will appear here once they are created
                  </p>
                </div>
              ) : (
                prescriptions.map((prescription) => (
                  <div key={prescription.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {prescription.medication_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Prescribed on {format(new Date(prescription.prescribed_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(prescription.status)}`}>
                        {prescription.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Dosage</h4>
                        <p className="text-gray-600 dark:text-gray-400">{prescription.dosage}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Frequency</h4>
                        <p className="text-gray-600 dark:text-gray-400">{prescription.frequency}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Duration</h4>
                        <p className="text-gray-600 dark:text-gray-400">{prescription.duration || 'Not specified'}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Refills Remaining</h4>
                        <p className="text-gray-600 dark:text-gray-400">{prescription.refills_remaining} of {prescription.total_refills}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {profile.role === 'patient' ? 'Doctor' : 'Patient'}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {profile.role === 'patient' 
                            ? `Dr. ${prescription.doctors?.name}`
                            : prescription.patients?.full_name
                          }
                        </p>
                      </div>
                      {prescription.expiry_date && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Expires</h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            {format(new Date(prescription.expiry_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>

                    {prescription.instructions && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 dark:text-white">Instructions</h4>
                        <p className="text-gray-600 dark:text-gray-400">{prescription.instructions}</p>
                      </div>
                    )}

                    {profile.role === 'patient' && prescription.status === 'active' && prescription.refills_remaining > 0 && (
                      <button
                        onClick={() => handleRefillRequest(prescription)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Request Refill
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'refills' && (
            <div className="space-y-4">
              {refillRequests.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">🔄</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No refill requests found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Refill requests will appear here when submitted
                  </p>
                </div>
              ) : (
                refillRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {request.prescriptions?.medication_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Requested on {format(new Date(request.request_date), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                        {request.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Medication Details</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {request.prescriptions?.dosage} - {request.prescriptions?.frequency}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {profile.role === 'patient' ? 'Doctor' : 'Patient'}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {profile.role === 'patient' 
                            ? `Dr. ${request.prescriptions?.doctors?.name}`
                            : request.prescriptions?.patients?.full_name
                          }
                        </p>
                      </div>
                    </div>

                    {request.pharmacy_info && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 dark:text-white">Pharmacy Information</h4>
                        <p className="text-gray-600 dark:text-gray-400">{request.pharmacy_info}</p>
                      </div>
                    )}

                    {request.notes && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 dark:text-white">Notes</h4>
                        <p className="text-gray-600 dark:text-gray-400">{request.notes}</p>
                      </div>
                    )}

                    {request.doctor_response && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 dark:text-white">Doctor Response</h4>
                        <p className="text-gray-600 dark:text-gray-400">{request.doctor_response}</p>
                      </div>
                    )}

                    {profile.role === 'doctor' && request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRefillResponse(request.id, 'approved', 'Refill approved')}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRefillResponse(request.id, 'denied', 'Refill denied - please schedule appointment')}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Deny
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Refill Request Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Request Refill: {selectedPrescription.medication_name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pharmacy Information
                </label>
                <textarea
                  value={refillForm.pharmacy_info}
                  onChange={(e) => setRefillForm({...refillForm, pharmacy_info: e.target.value})}
                  placeholder="Pharmacy name, address, phone number..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={refillForm.notes}
                  onChange={(e) => setRefillForm({...refillForm, notes: e.target.value})}
                  placeholder="Any additional information..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedPrescription(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={submitRefillRequest}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}