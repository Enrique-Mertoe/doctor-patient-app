'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

export default function MedicalRecordsView({ user, profile }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/medical-records')
      const data = await response.json()
      if (data.records) {
        setRecords(data.records)
      }
    } catch (error) {
      console.error('Error fetching medical records:', error)
    }
    setLoading(false)
  }

  const getRecordTypeColor = (type) => {
    switch (type) {
      case 'diagnosis': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'test_result': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'treatment': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'prescription': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'note': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getRecordTypeIcon = (type) => {
    switch (type) {
      case 'diagnosis': return '🔍'
      case 'test_result': return '📊'
      case 'treatment': return '💊'
      case 'prescription': return '📝'
      case 'note': return '📋'
      default: return '📄'
    }
  }

  const filteredRecords = records.filter(record => {
    const matchesFilter = filter === 'all' || record.record_type === filter
    const matchesSearch = searchTerm === '' || 
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return <div className="text-center py-8">Loading medical records...</div>
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Records</option>
              <option value="diagnosis">Diagnosis</option>
              <option value="test_result">Test Results</option>
              <option value="treatment">Treatment</option>
              <option value="prescription">Prescription</option>
              <option value="note">Notes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No medical records found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Medical records will appear here as they are created'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <div key={record.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getRecordTypeIcon(record.record_type)}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {record.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(record.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRecordTypeColor(record.record_type)}`}>
                  {record.record_type.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    {profile.role === 'patient' ? 'Doctor' : 'Patient'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {profile.role === 'patient' 
                      ? `Dr. ${record.doctors?.name} - ${record.doctors?.specialization}`
                      : record.patients?.full_name
                    }
                  </p>
                </div>
                {record.appointments?.medical_condition && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">Related Condition</h4>
                    <p className="text-gray-600 dark:text-gray-400">{record.appointments.medical_condition}</p>
                  </div>
                )}
              </div>

              {record.description && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                  <p className="text-gray-600 dark:text-gray-400">{record.description}</p>
                </div>
              )}

              {record.diagnosis && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Diagnosis</h4>
                  <p className="text-gray-600 dark:text-gray-400">{record.diagnosis}</p>
                </div>
              )}

              {record.treatment_plan && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Treatment Plan</h4>
                  <p className="text-gray-600 dark:text-gray-400">{record.treatment_plan}</p>
                </div>
              )}

              {record.test_results && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Test Results</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                    <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {typeof record.test_results === 'string' 
                        ? record.test_results 
                        : JSON.stringify(record.test_results, null, 2)
                      }
                    </pre>
                  </div>
                </div>
              )}

              {record.attachments && record.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Attachments</h4>
                  <div className="flex flex-wrap gap-2">
                    {record.attachments.map((attachment, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        📎 {attachment.name || `Attachment ${index + 1}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}