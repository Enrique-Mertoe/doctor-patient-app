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

    // Format slots for frontend
    const formattedSlots = existingSlots.map(slot => {
      const startTime = new Date(`2000-01-01T${slot.start_time}`)
      const endTime = new Date(`2000-01-01T${slot.end_time}`)
      
      return {
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        display: `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
        current_bookings: slot.current_bookings,
        max_capacity: slot.max_capacity,
        is_available: slot.is_available && slot.current_bookings < slot.max_capacity
      }
    })

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