import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user profile to verify they're a doctor
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (!profile || profile.role !== 'doctor') {
            return NextResponse.json({ error: 'Only doctors can view patient list' }, { status: 403 })
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

        // Fetch patients who have appointments with this doctor
        const { data: patients, error } = await supabase
            .from('appointments')
            .select(`
                patients!inner(
                    *,
                    user_profiles!inner(user_id, full_name)
                )
            `)
            .eq('doctor_id', doctor.id)

        if (error) {
            console.error('Error fetching patients:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Remove duplicates and flatten structure
        const uniquePatients = patients
            .reduce((acc, appointment) => {
                const patient = appointment.patients
                if (!acc.find(p => p.id === patient.id)) {
                    acc.push(patient)
                }
                return acc
            }, [])

        return NextResponse.json({ patients: uniquePatients || [] })
    } catch (error) {
        console.error('Error in patients API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}