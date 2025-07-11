import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardHeader from '../DashboardHeader'
import MedicalRecordsView from './MedicalRecordsView'

export default async function MedicalRecordsPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/login')
  }

  // Check if user needs onboarding
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile || !profile.onboarding_completed) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader user={user} profile={profile} />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Medical Records
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {profile.role === 'patient' 
                ? 'View your complete medical history and health records'
                : 'Manage patient medical records and create new entries'
              }
            </p>
          </div>
          
          <MedicalRecordsView user={user} profile={profile} />
        </div>
      </div>
    </div>
  )
}