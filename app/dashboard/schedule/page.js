import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '../../../components/DashboardLayout'
import DoctorSchedule from './DoctorSchedule'

export default async function SchedulePage() {
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

  // Only doctors can access schedule management
  if (profile.role !== 'doctor') {
    redirect('/dashboard')
  }

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Schedule Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your appointment slots and availability
        </p>
      </div>
      
      <DoctorSchedule user={user} profile={profile} />
    </DashboardLayout>
  )
}