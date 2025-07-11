'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Phone, Calendar, Users, FileText, AlertTriangle, Pill } from 'lucide-react'

export default function OnboardingForm({ user, existingProfile }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Form data - simplified for patients only
  const [formData, setFormData] = useState({
    role: 'patient', // Fixed as patient
    full_name: existingProfile?.full_name || '',
    phone: existingProfile?.phone || '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      router.push('/dashboard')
    } catch (error) {
      setMessage(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full mb-4">
          <User className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Complete Your Patient Profile
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Help us provide you with the best medical care by completing your profile
        </p>
      </div>

      {message && (
        <div className="p-3 rounded-md text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4" />
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Personal Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4" />
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Users className="w-4 h-4" />
                Emergency Contact Name
              </label>
              <input
                type="text"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Phone className="w-4 h-4" />
              Emergency Contact Phone
            </label>
            <input
              type="tel"
              value={formData.emergency_contact_phone}
              onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Medical Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Medical Information</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">(Optional)</span>
          </div>
          
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4" />
              Medical History
            </label>
            <textarea
              value={formData.medical_history}
              onChange={(e) => setFormData({...formData, medical_history: e.target.value})}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Any relevant medical history..."
            />
          </div>
          
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <AlertTriangle className="w-4 h-4" />
              Allergies
            </label>
            <textarea
              value={formData.allergies}
              onChange={(e) => setFormData({...formData, allergies: e.target.value})}
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Any known allergies..."
            />
          </div>
          
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Pill className="w-4 h-4" />
              Current Medications
            </label>
            <textarea
              value={formData.current_medications}
              onChange={(e) => setFormData({...formData, current_medications: e.target.value})}
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Current medications and dosages..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-3 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 font-medium"
        >
          {loading ? 'Completing Setup...' : 'Complete Setup'}
        </button>
      </form>
    </div>
  )
}