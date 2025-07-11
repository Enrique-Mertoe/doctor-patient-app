import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const supabase = await createClient()
        const { medical_condition, preferred_date } = await request.json()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!medical_condition) {
            return NextResponse.json({ error: 'Medical condition is required' }, { status: 400 })
        }

        // Get user profile to ensure they're a patient
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (!profile || profile.role !== 'patient') {
            return NextResponse.json({ error: 'Only patients can use smart booking' }, { status: 403 })
        }

        // Call the intelligent doctor assignment function
        const { data: assignment, error: assignmentError } = await supabase
            .rpc('auto_assign_doctor_and_slots', {
                condition_text: medical_condition,
                preferred_date: preferred_date || null
            })

        if (assignmentError) {
            console.error('Error in doctor assignment:', assignmentError)
            return NextResponse.json({ error: assignmentError.message }, { status: 500 })
        }

        if (!assignment || assignment.length === 0) {
            return NextResponse.json({ 
                error: 'No suitable doctors found for your condition at this time. Please try again later or contact support.' 
            }, { status: 404 })
        }

        const result = assignment[0]

        // Format the available slots for frontend
        const availableSlots = result.available_slots.map(slot => {
            const startTime = new Date(`2000-01-01T${slot.start_time}`)
            const endTime = new Date(`2000-01-01T${slot.end_time}`)
            
            return {
                id: slot.id,
                date: slot.date,
                start_time: slot.start_time,
                end_time: slot.end_time,
                display: `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
                current_bookings: slot.current_bookings,
                max_capacity: slot.max_capacity,
                is_available: slot.current_bookings < slot.max_capacity
            }
        })

        // Group slots by date for better presentation
        const slotsByDate = availableSlots.reduce((acc, slot) => {
            const dateKey = slot.date
            if (!acc[dateKey]) {
                acc[dateKey] = []
            }
            acc[dateKey].push(slot)
            return acc
        }, {})

        return NextResponse.json({
            assigned_doctor: {
                id: result.assigned_doctor_id,
                name: result.assigned_doctor_name,
                match_reason: result.match_reason
            },
            available_slots: availableSlots,
            slots_by_date: slotsByDate,
            message: `We found ${result.assigned_doctor_name} who specializes in treating your condition.`
        })
    } catch (error) {
        console.error('Error in smart booking API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Get suggestions for medical conditions (for autocomplete)
export async function GET(request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')

        if (!query || query.length < 2) {
            return NextResponse.json({ suggestions: [] })
        }

        // Get common conditions from doctors' specializations
        const { data: conditions, error } = await supabase
            .from('doctors')
            .select('conditions_treated')
            .eq('is_active', true)

        if (error) {
            console.error('Error fetching condition suggestions:', error)
            return NextResponse.json({ suggestions: [] })
        }

        // Flatten and filter conditions
        const allConditions = []
        conditions.forEach(doctor => {
            if (doctor.conditions_treated) {
                allConditions.push(...doctor.conditions_treated)
            }
        })

        // Remove duplicates and filter by query
        const uniqueConditions = [...new Set(allConditions)]
        const filteredConditions = uniqueConditions
            .filter(condition => 
                condition.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 10)

        // Add some common general conditions
        const commonConditions = [
            'General Checkup',
            'Cold and Flu',
            'Headache',
            'Back Pain',
            'Skin Rash',
            'Chest Pain',
            'Stomach Pain',
            'Fatigue',
            'Fever',
            'Cough',
            'Sore Throat',
            'Joint Pain'
        ].filter(condition => 
            condition.toLowerCase().includes(query.toLowerCase()) &&
            !filteredConditions.includes(condition)
        )

        const suggestions = [...filteredConditions, ...commonConditions].slice(0, 8)

        return NextResponse.json({ suggestions })
    } catch (error) {
        console.error('Error in condition suggestions API:', error)
        return NextResponse.json({ suggestions: [] })
    }
}