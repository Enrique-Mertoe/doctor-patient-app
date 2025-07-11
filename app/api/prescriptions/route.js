import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || 'all'

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

        let query = supabase
            .from('prescriptions')
            .select(`
                *,
                doctors(name, specialization),
                patients(full_name),
                medical_records(title, record_type)
            `)
            .order('prescribed_date', { ascending: false })

        if (profile.role === 'patient') {
            // Get patient record
            const { data: patient } = await supabase
                .from('patients')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (!patient) {
                return NextResponse.json({ error: 'Patient record not found' }, { status: 404 })
            }

            query = query.eq('patient_id', patient.id)
        } else if (profile.role === 'doctor') {
            // Get doctor record
            const { data: doctor } = await supabase
                .from('doctors')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (!doctor) {
                return NextResponse.json({ error: 'Doctor record not found' }, { status: 404 })
            }

            query = query.eq('doctor_id', doctor.id)
        }

        // Apply status filter
        if (status !== 'all') {
            query = query.eq('status', status)
        }

        const { data: prescriptions, error } = await query

        if (error) {
            console.error('Error fetching prescriptions:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ prescriptions: prescriptions || [] })
    } catch (error) {
        console.error('Error in prescriptions API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user profile - only doctors can create prescriptions
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (!profile || profile.role !== 'doctor') {
            return NextResponse.json({ error: 'Only doctors can create prescriptions' }, { status: 403 })
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

        const {
            patient_id,
            medical_record_id,
            medication_name,
            dosage,
            frequency,
            duration,
            instructions,
            total_refills,
            expiry_date,
            notes
        } = body

        const { data: prescription, error } = await supabase
            .from('prescriptions')
            .insert({
                patient_id,
                doctor_id: doctor.id,
                medical_record_id,
                medication_name,
                dosage,
                frequency,
                duration,
                instructions,
                refills_remaining: total_refills || 0,
                total_refills: total_refills || 0,
                expiry_date,
                notes
            })
            .select(`
                *,
                doctors(name, specialization),
                patients(full_name)
            `)
            .single()

        if (error) {
            console.error('Error creating prescription:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ prescription })
    } catch (error) {
        console.error('Error in prescriptions POST API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}