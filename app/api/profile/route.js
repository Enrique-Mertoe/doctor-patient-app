import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET - Get user profile
export async function GET(request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      user, 
      profile: profile || null,
      needsOnboarding: !profile || !profile.onboarding_completed
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update user profile
export async function PUT(request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, phone, date_of_birth } = body

    // Update user profile (for patients only in profile page)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role === 'patient') {
      // Update patient record
      const { error: patientError } = await supabase
        .from('patients')
        .upsert({
          user_id: user.id,
          profile_id: profile.id,
          full_name,
          email: user.email,
          phone,
          date_of_birth
        }, { onConflict: 'user_id' })

      if (patientError) {
        return NextResponse.json({ error: patientError.message }, { status: 500 })
      }
    }

    // Update user profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        full_name,
        phone,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}