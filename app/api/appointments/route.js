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

    // Check if patient already has an appointment at this exact time slot
    const { data: existingAppointment } = await supabase
      .from('appointments')
      .select('id')
      .eq('time_slot_id', timeSlotId)
      .neq('status', 'cancelled')

    if (existingAppointment && existingAppointment.length > 0) {
      // Check if the existing appointment is from the same patient
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (patient) {
        const { data: patientExistingAppt } = await supabase
          .from('appointments')
          .select('id')
          .eq('time_slot_id', timeSlotId)
          .eq('patient_id', patient.id)
          .neq('status', 'cancelled')
          .single()

        if (patientExistingAppt) {
          return NextResponse.json({ error: 'You already have an appointment at this time' }, { status: 409 })
        }
      }
    }

    // Additional check: Ensure patient doesn't have overlapping appointments
    const { data: patientData } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (patientData) {
      const { data: overlappingAppointments } = await supabase
        .from('appointments')
        .select(`
          id,
          time_slots!inner(date, start_time, end_time)
        `)
        .eq('patient_id', patientData.id)
        .eq('time_slots.date', slot.date)
        .neq('status', 'cancelled')

      if (overlappingAppointments && overlappingAppointments.length > 0) {
        // Check for time conflicts
        const slotStart = new Date(`${slot.date}T${slot.start_time}`)
        const slotEnd = new Date(`${slot.date}T${slot.end_time}`)

        for (const existingAppt of overlappingAppointments) {
          const existingStart = new Date(`${existingAppt.time_slots.date}T${existingAppt.time_slots.start_time}`)
          const existingEnd = new Date(`${existingAppt.time_slots.date}T${existingAppt.time_slots.end_time}`)

          // Check if times overlap
          if ((slotStart < existingEnd && slotEnd > existingStart)) {
            return NextResponse.json({ 
              error: 'You already have an appointment during this time period' 
            }, { status: 409 })
          }
        }
      }
    }

    // Create or update patient - filter out null/empty date_of_birth
    const cleanPatientData = {
      user_id: user.id,
      ...patientData
    }
    
    // Remove date_of_birth if it's null or empty to avoid DB constraint issues
    if (!cleanPatientData.date_of_birth) {
      delete cleanPatientData.date_of_birth
    }

    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .upsert(cleanPatientData, { onConflict: 'user_id' })
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

    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let appointments = []

    if (profile.role === 'patient') {
      // Get patient's appointments
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (patient) {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            time_slots (date, start_time, end_time),
            doctors (name, specialization)
          `)
          .eq('patient_id', patient.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        appointments = data || []
      }
    } else if (profile.role === 'doctor') {
      // Get doctor's appointments
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (doctor) {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            time_slots (date, start_time, end_time),
            patients (full_name, email, phone, date_of_birth)
          `)
          .eq('doctor_id', doctor.id)
          .order('time_slots(date)', { ascending: true })

        if (error) throw error
        appointments = data || []
      }
    }

    return NextResponse.json({ appointments })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}