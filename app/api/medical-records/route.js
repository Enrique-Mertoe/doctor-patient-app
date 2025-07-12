import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const patientId = searchParams.get('patientId')

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
            .from('medical_records')
            .select(`
                *,
                doctors(name, specialization),
                patients(full_name),
                appointments(medical_condition, created_at)
            `)
            .order('created_at', { ascending: false })

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

            // If patientId is provided, filter by that patient
            if (patientId) {
                query = query.eq('patient_id', patientId)
            } else {
                // Show all records for this doctor
                query = query.eq('doctor_id', doctor.id)
            }
        }

        const { data: records, error } = await query

        if (error) {
            console.error('Error fetching medical records:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ records: records || [] })
    } catch (error) {
        console.error('Error in medical records API:', error)
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

        // Get user profile - only doctors can create medical records
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (!profile || profile.role !== 'doctor') {
            return NextResponse.json({ error: 'Only doctors can create medical records' }, { status: 403 })
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
            appointment_id,
            record_type,
            title,
            description,
            diagnosis,
            treatment_plan,
            test_results,
            attachments
        } = body

        const { data: record, error } = await supabase
            .from('medical_records')
            .insert({
                patient_id,
                doctor_id: doctor.id,
                appointment_id,
                record_type,
                title,
                description,
                diagnosis,
                treatment_plan,
                test_results,
                attachments
            })
            .select(`
                *,
                doctors(name, specialization),
                patients(full_name)
            `)
            .single()

        if (error) {
            console.error('Error creating medical record:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ record })
    } catch (error) {
        console.error('Error in medical records POST API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}