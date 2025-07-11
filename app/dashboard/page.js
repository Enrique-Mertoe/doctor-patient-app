import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AppointmentBooking from './AppointmentBooking'
import AppointmentHistory from './AppointmentHistory'
import DashboardHeader from './DashboardHeader'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader user={user} />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Medical Appointment Dashboard
            </h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Book New Appointment</h2>
                <AppointmentBooking />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Your Appointments</h2>
                <AppointmentHistory />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}