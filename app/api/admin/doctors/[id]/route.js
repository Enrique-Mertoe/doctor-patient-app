import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function PATCH(request, { params }) {
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

    const { id } = params
    const body = await request.json()

    // Update doctor record
    const { data: doctor, error: updateError } = await supabase
      .from('doctors')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ 
      doctor,
      message: 'Doctor updated successfully' 
    })

  } catch (error) {
    console.error('Error updating doctor:', error)
    return NextResponse.json({ 
      error: 'Failed to update doctor' 
    }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
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

    const { id } = params

    // Check if doctor has any appointments before deleting
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', id)
      .limit(1)

    if (appointmentsError) {
      throw appointmentsError
    }

    if (appointments.length > 0) {
      // Instead of deleting, deactivate the doctor
      const { data: doctor, error: updateError } = await supabase
        .from('doctors')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({ 
        doctor,
        message: 'Doctor deactivated (has existing appointments)' 
      })
    }

    // Delete doctor if no appointments
    const { error: deleteError } = await supabase
      .from('doctors')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ 
      message: 'Doctor deleted successfully' 
    })

  } catch (error) {
    console.error('Error deleting doctor:', error)
    return NextResponse.json({ 
      error: 'Failed to delete doctor' 
    }, { status: 500 })
  }
}