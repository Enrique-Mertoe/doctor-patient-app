'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          setError(error.message)
          setTimeout(() => router.push('/auth/login'), 3000)
          return
        }

        if (data.session) {
          const user = data.session.user
          
          // Check if user has a patient profile (for Google OAuth users)
          const { data: existingProfile } = await supabase
            .from('patients')
            .select('id')
            .eq('user_id', user.id)
            .single()

          if (!existingProfile) {
            // User signed up via Google but doesn't have a patient profile
            // Create a basic patient profile and redirect to onboarding
            try {
              const { error: profileError } = await supabase
                .from('patients')
                .insert({
                  user_id: user.id,
                  name: user.user_metadata.full_name || user.email,
                  email: user.email
                })

              if (profileError) {
                console.error('Error creating patient profile:', profileError)
              }

              // Assign user to patient group
              const { error: groupError } = await supabase
                .rpc('assign_user_to_group', {
                  target_user_id: user.id,
                  group_name: 'patient',
                  assigning_user_id: user.id
                })

              if (groupError) {
                console.error('Error assigning user to patient group:', groupError)
              }

              router.push('/onboarding')
            } catch (error) {
              console.error('Error in profile creation:', error)
              router.push('/onboarding')
            }
          } else {
            // User has a profile, redirect to dashboard
            router.push('/dashboard')
          }
        } else {
          setError('No session found')
          setTimeout(() => router.push('/auth/login'), 3000)
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setError('Authentication failed')
        setTimeout(() => router.push('/auth/login'), 3000)
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Completing authentication...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Authentication Failed</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to login page...</p>
        </div>
      </div>
    )
  }

  return null
}