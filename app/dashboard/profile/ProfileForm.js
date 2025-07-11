'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function ProfileForm({ user, patient }) {
  const [formData, setFormData] = useState({
    full_name: patient?.full_name || '',
    email: patient?.email || user.email,
    phone: patient?.phone || '',
    date_of_birth: patient?.date_of_birth || ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('patients')
        .upsert({
          user_id: user.id,
          ...formData
        }, { onConflict: 'user_id' })

      if (error) throw error

      setMessage('Profile updated successfully!')
    } catch (error) {
      setMessage(error.message)
    }
    setLoading(false)
  }

  const handlePasswordReset = async () => {
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error
      setMessage('Password reset email sent!')
    } catch (error) {
      setMessage(error.message)
    }
    setLoading(false)
  }

  return (
    <div className=\"space-y-6\">
      <div className=\"flex justify-between items-center\">
        <h2 className=\"text-lg font-medium text-gray-900 dark:text-white\">Personal Information</h2>\n        <Link\n          href=\"/dashboard\"\n          className=\"text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 text-sm\"\n        >\n          ← Back to Dashboard\n        </Link>\n      </div>\n\n      {message && (\n        <div className={`p-3 rounded-md text-sm ${\n          message.includes('successfully') || message.includes('sent')\n            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'\n            : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'\n        }`}>\n          {message}\n        </div>\n      )}\n\n      <form onSubmit={handleSubmit} className=\"space-y-4\">\n        <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">\n          <div>\n            <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300\">Full Name</label>\n            <input\n              type=\"text\"\n              value={formData.full_name}\n              onChange={(e) => setFormData({...formData, full_name: e.target.value})}\n              className=\"mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500\"\n              required\n            />\n          </div>\n          <div>\n            <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300\">Email</label>\n            <input\n              type=\"email\"\n              value={formData.email}\n              onChange={(e) => setFormData({...formData, email: e.target.value})}\n              className=\"mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500\"\n              required\n            />\n          </div>\n        </div>\n\n        <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">\n          <div>\n            <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300\">Phone</label>\n            <input\n              type=\"tel\"\n              value={formData.phone}\n              onChange={(e) => setFormData({...formData, phone: e.target.value})}\n              className=\"mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500\"\n            />\n          </div>\n          <div>\n            <label className=\"block text-sm font-medium text-gray-700 dark:text-gray-300\">Date of Birth</label>\n            <input\n              type=\"date\"\n              value={formData.date_of_birth}\n              onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}\n              className=\"mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500\"\n            />\n          </div>\n        </div>\n\n        <div className=\"flex space-x-4\">\n          <button\n            type=\"submit\"\n            disabled={loading}\n            className=\"flex-1 bg-indigo-600 dark:bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50\"\n          >\n            {loading ? 'Updating...' : 'Update Profile'}\n          </button>\n          <button\n            type=\"button\"\n            onClick={handlePasswordReset}\n            disabled={loading}\n            className=\"flex-1 bg-gray-600 dark:bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50\"\n          >\n            Reset Password\n          </button>\n        </div>\n      </form>\n\n      <div className=\"border-t border-gray-200 dark:border-gray-700 pt-6\">\n        <h3 className=\"text-lg font-medium text-gray-900 dark:text-white mb-2\">Account Information</h3>\n        <div className=\"text-sm text-gray-600 dark:text-gray-400 space-y-1\">\n          <p><strong>User ID:</strong> {user.id}</p>\n          <p><strong>Account Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>\n          <p><strong>Email Confirmed:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</p>\n        </div>\n      </div>\n    </div>\n  )\n}