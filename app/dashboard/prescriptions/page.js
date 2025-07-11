import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '../../../components/DashboardLayout'
import PrescriptionsView from './PrescriptionsView'

export default async function PrescriptionsPage() {
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
    <DashboardLayout user={user} profile={profile}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Prescriptions & Refills
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {profile.role === 'patient' 
            ? 'View your prescriptions and request refills'
            : 'Manage patient prescriptions and refill requests'
          }
        </p>
      </div>
      
      <PrescriptionsView user={user} profile={profile} />
    </DashboardLayout>
  )
}