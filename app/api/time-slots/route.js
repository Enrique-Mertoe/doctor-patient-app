import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateTimeSlots } from '@/lib/timeSlots'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  let doctorId = searchParams.get('doctorId')

  if (!date) {
    return NextResponse.json({ error: 'Date required' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    // If no doctorId provided, get the first active doctor
    if (!doctorId) {
      const { data: doctors } = await supabase
        .from('doctors')
        .select('id')
        .eq('is_active', true)
        .limit(1)

      if (doctors && doctors.length > 0) {
        doctorId = doctors[0].id
      } else {
        return NextResponse.json({ error: 'No active doctors found' }, { status: 404 })
      }
    }

    // Get existing slots for the date or create them
    let { data: existingSlots, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('date', date)
      .order('start_time')

    if (error) throw error

    // If no slots exist for this date, generate them
    if (!existingSlots || existingSlots.length === 0) {
      const allSlots = generateTimeSlots(date)
      const slotsToInsert = allSlots.map(slot => ({
        doctor_id: doctorId,
        date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        max_capacity: 5,
        current_bookings: 0,
        is_available: true
      }))

      const { data: newSlots, error: insertError } = await supabase
        .from('time_slots')
        .insert(slotsToInsert)
        .select()

      if (insertError) throw insertError
      existingSlots = newSlots
    }

    // Get current user to check for existing appointments
    const { data: { user } } = await supabase.auth.getUser()
    let patientId = null
    
    if (user) {
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (patient) {
        patientId = patient.id
      }
    }

    // Format slots for frontend with enhanced availability checking
    const formattedSlots = await Promise.all(existingSlots.map(async (slot) => {
      const startTime = new Date(`2000-01-01T${slot.start_time}`)
      const endTime = new Date(`2000-01-01T${slot.end_time}`)
      
      let isAvailableForUser = slot.is_available && slot.current_bookings < slot.max_capacity
      let unavailableReason = null

      // Check if current user already has an appointment at this time
      if (patientId && isAvailableForUser) {
        const { data: existingAppt } = await supabase
          .from('appointments')
          .select('id')
          .eq('patient_id', patientId)
          .eq('time_slot_id', slot.id)
          .neq('status', 'cancelled')
          .single()

        if (existingAppt) {
          isAvailableForUser = false
          unavailableReason = 'You already have an appointment at this time'
        } else {
          // Check for overlapping appointments on the same day
          const { data: overlappingAppts } = await supabase
            .from('appointments')
            .select(`
              id,
              time_slots!inner(start_time, end_time)
            `)
            .eq('patient_id', patientId)
            .eq('time_slots.date', date)
            .neq('status', 'cancelled')

          if (overlappingAppts && overlappingAppts.length > 0) {
            for (const appt of overlappingAppts) {
              const apptStart = new Date(`${date}T${appt.time_slots.start_time}`)
              const apptEnd = new Date(`${date}T${appt.time_slots.end_time}`)
              const slotStart = new Date(`${date}T${slot.start_time}`)
              const slotEnd = new Date(`${date}T${slot.end_time}`)

              if (slotStart < apptEnd && slotEnd > apptStart) {
                isAvailableForUser = false
                unavailableReason = 'You have a conflicting appointment'
                break
              }
            }
          }
        }
      }

      return {
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        display: `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
        current_bookings: slot.current_bookings,
        max_capacity: slot.max_capacity,
        is_available: isAvailableForUser,
        unavailable_reason: unavailableReason
      }
    }))

    return NextResponse.json({ slots: formattedSlots })
  } catch (error) {
    console.error('Error fetching time slots:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  const { date, doctorId } = await request.json()

  if (!date || !doctorId) {
    return NextResponse.json({ error: 'Date and doctorId required' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    const slots = generateTimeSlots(date)
    const slotsToInsert = slots.map(slot => ({
      doctor_id: doctorId,
      date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      max_capacity: 5,
      current_bookings: 0,
      is_available: true
    }))

    const { data, error } = await supabase
      .from('time_slots')
      .upsert(slotsToInsert, { onConflict: 'doctor_id,date,start_time' })
      .select()

    if (error) throw error

    return NextResponse.json({ slots: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}