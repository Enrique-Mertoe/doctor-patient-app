import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// POST - Complete onboarding
export async function POST(request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      role,
      full_name,
      phone,
      // Patient fields
      date_of_birth,
      emergency_contact_name,
      emergency_contact_phone,
      medical_history,
      allergies,
      current_medications,
      // Doctor fields
      specialization
    } = body

    // Validate required fields
    if (!role || !full_name) {
      return NextResponse.json({ error: 'Role and full name are required' }, { status: 400 })
    }

    if (!['doctor', 'patient'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (role === 'doctor' && !specialization) {
      return NextResponse.json({ error: 'Specialization is required for doctors' }, { status: 400 })
    }

    // Start a transaction to ensure data consistency
    const { data, error } = await supabase.rpc('onboard_user_transaction', {
      p_user_id: user.id,
      p_role: role,
      p_full_name: full_name,
      p_email: user.email,
      p_phone: phone || null,
      p_date_of_birth: date_of_birth || null,
      p_emergency_contact_name: emergency_contact_name || null,
      p_emergency_contact_phone: emergency_contact_phone || null,
      p_medical_history: medical_history || null,
      p_allergies: allergies || null,
      p_current_medications: current_medications || null,
      p_specialization: specialization || null
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get the created profile for response
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ 
      success: true, 
      profile,
      message: 'Onboarding completed successfully'
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}