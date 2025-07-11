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
        permission_name: 'can_manage_doctors'
      })

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch all doctors
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('*')
      .order('created_at', { ascending: false })

    if (doctorsError) {
      throw doctorsError
    }

    return NextResponse.json({ doctors })

  } catch (error) {
    console.error('Error fetching doctors:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch doctors' 
    }, { status: 500 })
  }
}

export async function POST(request) {
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
        permission_name: 'can_manage_doctors'
      })

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, phone, specialization, license_number, years_experience, bio, is_active } = body

    // Validate required fields
    if (!name || !email || !specialization) {
      return NextResponse.json({ 
        error: 'Name, email, and specialization are required' 
      }, { status: 400 })
    }

    // Create doctor record
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .insert({
        name,
        email,
        phone,
        specialization,
        license_number,
        years_experience: years_experience ? parseInt(years_experience) : null,
        bio,
        is_active: is_active !== false, // Default to true
        created_by: user.id
      })
      .select()
      .single()

    if (doctorError) {
      throw doctorError
    }

    // If email is provided, we could potentially create a user account
    // and assign them to the doctor group, but for now we'll just create the doctor profile
    
    return NextResponse.json({ 
      doctor,
      message: 'Doctor created successfully' 
    })

  } catch (error) {
    console.error('Error creating doctor:', error)
    
    // Handle specific errors
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({ 
        error: 'A doctor with this email already exists' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to create doctor' 
    }, { status: 500 })
  }
}