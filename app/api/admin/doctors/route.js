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

    // Check if doctor email already exists
    const { data: existingDoctor } = await supabase
      .from('doctors')
      .select('email')
      .eq('email', email)
      .single()

    if (existingDoctor) {
      return NextResponse.json({ 
        error: 'A doctor with this email already exists' 
      }, { status: 400 })
    }

    // Generate a temporary password for the doctor account
    const tempPassword = generateTemporaryPassword()

    // Create Supabase auth account for the doctor
    const { data: authData, error: authCreateError } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: false, // They'll need to confirm via email
      user_metadata: {
        name: name,
        role: 'doctor',
        specialization: specialization,
        onboarding_completed: false
      }
    })

    if (authCreateError) {
      console.error('Error creating auth user:', authCreateError)
      return NextResponse.json({ 
        error: 'Failed to create doctor account: ' + authCreateError.message 
      }, { status: 400 })
    }

    const doctorUserId = authData.user.id

    try {
      // Create doctor record
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .insert({
          user_id: doctorUserId,
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
        // If doctor creation fails, clean up the auth account
        await supabase.auth.admin.deleteUser(doctorUserId)
        throw doctorError
      }

      // Assign doctor to doctor group
      const { error: groupError } = await supabase
        .rpc('assign_user_to_group', {
          target_user_id: doctorUserId,
          group_name: 'doctor',
          assigning_user_id: user.id
        })

      if (groupError) {
        console.error('Error assigning doctor to group:', groupError)
        // Don't fail the entire operation for this
      }

      // Send invitation email to the doctor
      try {
        const emailResponse = await fetch(`${request.url.replace('/api/admin/doctors', '/api/emails')}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization')
          },
          body: JSON.stringify({
            to: email,
            type: 'doctor_invitation',
            data: {
              doctor_name: name,
              admin_name: user.user_metadata?.name || user.email,
              specialization: specialization,
              temporary_password: tempPassword,
              login_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/login`,
              dashboard_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`
            }
          })
        })

        if (!emailResponse.ok) {
          console.error('Failed to send invitation email')
          // Don't fail the entire operation for email sending failure
        }
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError)
        // Don't fail the entire operation for email sending failure
      }

      return NextResponse.json({ 
        doctor,
        auth_user_id: doctorUserId,
        message: 'Doctor created successfully and invitation email sent',
        temp_password: tempPassword // For development - remove in production
      })

    } catch (error) {
      // If anything fails after auth user creation, clean up
      await supabase.auth.admin.deleteUser(doctorUserId)
      throw error
    }

  } catch (error) {
    console.error('Error creating doctor:', error)
    
    // Handle specific errors
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({ 
        error: 'A doctor with this email already exists' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to create doctor: ' + error.message 
    }, { status: 500 })
  }
}

// Helper function to generate a temporary password
function generateTemporaryPassword() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  
  // Ensure at least one uppercase, lowercase, number, and special char
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  password += '0123456789'[Math.floor(Math.random() * 10)]
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]
  
  // Fill the rest randomly
  for (let i = 4; i < 12; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}