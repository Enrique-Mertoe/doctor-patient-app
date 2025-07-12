import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// POST - Complete patient onboarding
export async function POST(request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      role = 'patient', // Always patient now
      full_name,
      phone,
      date_of_birth,
      emergency_contact_name,
      emergency_contact_phone,
      medical_history,
      allergies,
      current_medications
    } = body

    // Validate required fields
    if (!full_name) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }

    // Check if user already has a profile
    const { data: existingProfile } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingProfile) {
      return NextResponse.json({ error: 'User already has a profile' }, { status: 400 })
    }

    // Create patient profile
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert({
        user_id: user.id,
        name: full_name,
        email: user.email,
        phone: phone || null,
        date_of_birth: date_of_birth || null,
        emergency_contact_name: emergency_contact_name || null,
        emergency_contact_phone: emergency_contact_phone || null,
        medical_history: medical_history || null,
        allergies: allergies || null,
        current_medications: current_medications || null
      })
      .select()
      .single()

    if (patientError) {
      throw patientError
    }

    // Assign user to patient group using the new user groups system
    const { error: groupError } = await supabase
      .rpc('assign_user_to_group', {
        target_user_id: user.id,
        group_name: 'patient',
        assigning_user_id: user.id
      })

    if (groupError) {
      console.error('Error assigning user to patient group:', groupError)
      // Don't fail the onboarding if group assignment fails
    }

    // Send welcome email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          type: 'welcome',
          to: user.email,
          data: {
            userName: full_name
          }
        })
      })
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError)
      // Don't fail onboarding if email fails
    }

    return NextResponse.json({ 
      success: true, 
      patient,
      message: 'Patient profile created successfully'
    })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ 
      error: 'Failed to complete onboarding' 
    }, { status: 500 })
  }
}