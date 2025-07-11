import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateTimeSlots } from '@/lib/timeSlots'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const doctorId = searchParams.get('doctorId')

  if (!date || !doctorId) {
    return NextResponse.json({ error: 'Date and doctorId required' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    // Get existing slots for the date
    const { data: existingSlots } = await supabase
      .from('time_slots')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('date', date)

    // Generate all possible slots
    const allSlots = generateTimeSlots(date)
    
    // Merge with existing data
    const availableSlots = allSlots.map(slot => {
      const existing = existingSlots?.find(s => s.start_time === slot.start_time)
      return {
        ...slot,
        id: existing?.id,
        current_bookings: existing?.current_bookings || 0,
        is_available: existing?.is_available ?? true,
        max_capacity: existing?.max_capacity || 5
      }
    })

    return NextResponse.json({ slots: availableSlots })
  } catch (error) {
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