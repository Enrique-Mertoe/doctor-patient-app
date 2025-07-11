import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user has admin permissions
    const { data: hasAccess } = await supabase
      .rpc('user_has_permission', {
        user_uuid: user.id,
        permission_name: 'can_access_admin_panel'
      })

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch stats in parallel
    const [
      { count: totalUsers },
      { count: activeDoctors },
      { count: todayAppointments },
      { count: totalPatients }
    ] = await Promise.all([
      // Total users from auth.users
      supabase
        .from('user_group_memberships')
        .select('user_id', { count: 'exact', head: true }),
      
      // Active doctors
      supabase
        .from('doctors')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      
      // Today's appointments
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .lt('appointment_date', new Date(Date.now() + 86400000).toISOString().split('T')[0]),
      
      // Total patients
      supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
    ])

    const stats = {
      totalUsers: totalUsers || 0,
      activeDoctors: activeDoctors || 0,
      todayAppointments: todayAppointments || 0,
      totalPatients: totalPatients || 0,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch stats' 
    }, { status: 500 })
  }
}