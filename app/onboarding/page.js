import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingForm from './OnboardingForm'

async function getProfileData() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/login')
  }

  // Use API to check profile status (but since we're on server, we'll do direct call for now)
  // In production, you might want to add RLS or use service role key
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profile?.onboarding_completed) {
    redirect('/dashboard')
  }

  return { user, profile }
}

export default async function OnboardingPage() {
  const { user, profile } = await getProfileData()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to the Medical Appointment System
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Let's set up your profile to get started
            </p>
          </div>
          
          <OnboardingForm user={user} existingProfile={profile} />
        </div>
      </div>
    </div>
  )
}