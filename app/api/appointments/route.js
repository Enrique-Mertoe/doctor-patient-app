import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request) {
  const { timeSlotId, patientData, medicalCondition } = await request.json()

  if (!timeSlotId || !patientData || !medicalCondition) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check slot availability
    const { data: slot, error: slotError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', timeSlotId)
      .single()

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Time slot not found' }, { status: 404 })
    }

    if (!slot.is_available || slot.current_bookings >= slot.max_capacity) {
      return NextResponse.json({ error: 'Time slot is full' }, { status: 409 })
    }

    // Create or update patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .upsert({
        user_id: user.id,
        ...patientData
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (patientError) throw patientError

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        patient_id: patient.id,
        doctor_id: slot.doctor_id,
        time_slot_id: timeSlotId,
        medical_condition: medicalCondition,
        status: 'scheduled'
      })
      .select(`
        *,
        time_slots (date, start_time, end_time),
        doctors (name, specialization)
      `)
      .single()

    if (appointmentError) throw appointmentError

    return NextResponse.json({ appointment })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        time_slots (date, start_time, end_time),
        doctors (name, specialization),
        patients!inner (user_id)
      `)
      .eq('patients.user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ appointments })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}