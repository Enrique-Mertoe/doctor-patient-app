import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request, { params }) {
    try {
        const supabase = await createClient()
        const { id } = params
        const body = await request.json()

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

        if (!profile || profile.role !== 'doctor') {
            return NextResponse.json({ error: 'Only doctors can update appointment status' }, { status: 403 })
        }

        // Get doctor record
        const { data: doctor } = await supabase
            .from('doctors')
            .select('id')
            .eq('user_id', user.id)
            .single()

        if (!doctor) {
            return NextResponse.json({ error: 'Doctor record not found' }, { status: 404 })
        }

        const { status, notes } = body

        // Update appointment
        const { data: appointment, error } = await supabase
            .from('appointments')
            .update({
                status,
                notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('doctor_id', doctor.id) // Ensure doctor can only update their own appointments
            .select(`
                *,
                time_slots(date, start_time, end_time),
                patients(full_name, email, phone),
                doctors(name, specialization)
            `)
            .single()

        if (error) {
            console.error('Error updating appointment:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // If appointment is cancelled, make the time slot available again
        if (status === 'cancelled') {
            await supabase
                .from('time_slots')
                .update({
                    current_bookings: supabase.raw('current_bookings - 1'),
                    is_available: true
                })
                .eq('id', appointment.time_slot_id)
        }

        // Create notification for patient about status change
        if (status === 'cancelled' || status === 'completed') {
            await supabase
                .from('notifications')
                .insert({
                    user_id: appointment.patients.user_id,
                    type: 'appointment_update',
                    title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                    message: `Your appointment with Dr. ${appointment.doctors.name} has been ${status}.`,
                    metadata: {
                        appointment_id: appointment.id,
                        status: status
                    }
                })
        }

        return NextResponse.json({ appointment })
    } catch (error) {
        console.error('Error in appointment update API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    try {
        const supabase = await createClient()
        const { id } = params

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

        let canDelete = false
        let appointmentQuery = supabase
            .from('appointments')
            .select('*, time_slots(id)')
            .eq('id', id)

        if (profile.role === 'patient') {
            // Patient can cancel their own appointments
            const { data: patient } = await supabase
                .from('patients')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (patient) {
                appointmentQuery = appointmentQuery.eq('patient_id', patient.id)
                canDelete = true
            }
        } else if (profile.role === 'doctor') {
            // Doctor can cancel appointments in their schedule
            const { data: doctor } = await supabase
                .from('doctors')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (doctor) {
                appointmentQuery = appointmentQuery.eq('doctor_id', doctor.id)
                canDelete = true
            }
        }

        if (!canDelete) {
            return NextResponse.json({ error: 'Unauthorized to cancel this appointment' }, { status: 403 })
        }

        const { data: appointment, error: fetchError } = await appointmentQuery.single()

        if (fetchError || !appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
        }

        // Update appointment status to cancelled instead of deleting
        const { error: updateError } = await supabase
            .from('appointments')
            .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        if (updateError) {
            console.error('Error cancelling appointment:', updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        // Make the time slot available again
        if (appointment.time_slots) {
            await supabase
                .from('time_slots')
                .update({
                    current_bookings: supabase.raw('current_bookings - 1'),
                    is_available: true
                })
                .eq('id', appointment.time_slots.id)
        }

        return NextResponse.json({ message: 'Appointment cancelled successfully' })
    } catch (error) {
        console.error('Error in appointment cancellation API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}