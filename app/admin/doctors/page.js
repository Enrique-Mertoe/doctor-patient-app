'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield, 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Stethoscope
} from 'lucide-react'

export default function DoctorManagement() {
  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    license_number: '',
    years_experience: '',
    bio: '',
    is_active: true
  })

  useEffect(() => {
    checkAdminAccess()
    fetchDoctors()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/admin/check-access')
      const data = await response.json()
      
      if (!data.hasAccess) {
        router.push('/dashboard')
        return
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/dashboard')
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/admin/doctors')
      const data = await response.json()
      
      if (response.ok) {
        setDoctors(data.doctors || [])
      } else {
        setMessage(data.error || 'Failed to fetch doctors')
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
      setMessage('Failed to fetch doctors')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDoctor = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDoctor)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Doctor created successfully!')
        setShowAddForm(false)
        setNewDoctor({
          name: '',
          email: '',
          phone: '',
          specialization: '',
          license_number: '',
          years_experience: '',
          bio: '',
          is_active: true
        })
        fetchDoctors()
      } else {
        setMessage(data.error || 'Failed to create doctor')
      }
    } catch (error) {
      console.error('Error creating doctor:', error)
      setMessage('Failed to create doctor')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (doctorId, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/doctors/${doctorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (response.ok) {
        fetchDoctors()
        setMessage(`Doctor ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      } else {
        const data = await response.json()
        setMessage(data.error || 'Failed to update doctor status')
      }
    } catch (error) {
      console.error('Error updating doctor:', error)
      setMessage('Failed to update doctor status')
    }
  }

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && !showAddForm) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading doctors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/admin" className="mr-4">
                <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" />
              </Link>
              <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Doctor Management</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add and manage doctor profiles</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Doctor
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.includes('successfully') 
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
              : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
          }`}>
            {message}
          </div>
        )}

        {/* Add Doctor Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Doctor</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateDoctor} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Users className="w-4 h-4" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={newDoctor.name}
                      onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Mail className="w-4 h-4" />
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newDoctor.email}
                      onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newDoctor.phone}
                      onChange={(e) => setNewDoctor({...newDoctor, phone: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Stethoscope className="w-4 h-4" />
                      Specialization *
                    </label>
                    <input
                      type="text"
                      value={newDoctor.specialization}
                      onChange={(e) => setNewDoctor({...newDoctor, specialization: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Cardiology, General Practice"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={newDoctor.license_number}
                      onChange={(e) => setNewDoctor({...newDoctor, license_number: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      value={newDoctor.years_experience}
                      onChange={(e) => setNewDoctor({...newDoctor, years_experience: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Bio (Optional)
                  </label>
                  <textarea
                    value={newDoctor.bio}
                    onChange={(e) => setNewDoctor({...newDoctor, bio: e.target.value})}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Brief professional background..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newDoctor.is_active}
                    onChange={(e) => setNewDoctor({...newDoctor, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Active (can receive appointments)
                  </label>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Doctor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search doctors by name, specialization, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Doctors List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Doctors ({filteredDoctors.length})
            </h3>
          </div>

          {filteredDoctors.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No doctors found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first doctor.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDoctors.map((doctor) => (
                <div key={doctor.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                        <Stethoscope className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {doctor.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {doctor.specialization}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {doctor.email}
                          </span>
                          {doctor.phone && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {doctor.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        doctor.is_active
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {doctor.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleToggleActive(doctor.id, doctor.is_active)}
                        className={`p-2 rounded-md ${
                          doctor.is_active
                            ? 'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900'
                            : 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900'
                        }`}
                        title={doctor.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {doctor.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {doctor.bio && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                      {doctor.bio}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    {doctor.license_number && (
                      <span>License: {doctor.license_number}</span>
                    )}
                    {doctor.years_experience && (
                      <span>{doctor.years_experience} years experience</span>
                    )}
                    <span>Created: {new Date(doctor.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}