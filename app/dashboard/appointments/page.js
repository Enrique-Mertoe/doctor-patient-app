import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '../../../components/DashboardLayout'
import AppointmentBooking from '../AppointmentBooking'
import AppointmentHistory from '../AppointmentHistory'

export default async function AppointmentsPage() {
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
          Appointments
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {profile.role === 'patient' 
            ? 'Book new appointments and view your appointment history'
            : 'Manage patient appointments and schedule'
          }
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {profile.role === 'patient' ? 'Book New Appointment' : 'Appointment Booking'}
          </h2>
          <AppointmentBooking user={user} profile={profile} />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Appointment History
          </h2>
          <AppointmentHistory user={user} profile={profile} />
        </div>
      </div>
    </DashboardLayout>
  )
}