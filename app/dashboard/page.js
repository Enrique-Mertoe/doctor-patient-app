import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '../../components/DashboardLayout'
import PatientDashboard from './PatientDashboard'
import DoctorDashboard from './DoctorDashboard'

export default async function DashboardPage() {
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
      {profile.role === 'patient' ? (
        <PatientDashboard user={user} profile={profile} />
      ) : profile.role === 'doctor' ? (
        <DoctorDashboard user={user} profile={profile} />
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Unknown user role. Please contact support.
          </h2>
        </div>
      )}
    </DashboardLayout>
  )
}