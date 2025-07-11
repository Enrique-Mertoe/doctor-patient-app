import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const supabase = await createClient()

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
            .from('prescription_refill_requests')
            .select(`
                *,
                prescriptions(
                    medication_name,
                    dosage,
                    frequency,
                    refills_remaining,
                    expiry_date,
                    doctors(name, specialization),
                    patients(full_name)
                )
            `)
            .order('request_date', { ascending: false })

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

            // Filter by prescriptions from this doctor
            query = query.eq('prescriptions.doctor_id', doctor.id)
        }

        const { data: refillRequests, error } = await query

        if (error) {
            console.error('Error fetching refill requests:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ refillRequests: refillRequests || [] })
    } catch (error) {
        console.error('Error in prescription refills API:', error)
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

        // Get user profile to determine role
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        if (profile.role === 'patient') {
            // Patient requesting refill
            const { data: patient } = await supabase
                .from('patients')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (!patient) {
                return NextResponse.json({ error: 'Patient record not found' }, { status: 404 })
            }

            const { prescription_id, pharmacy_info, notes } = body

            // Check if prescription exists and has refills remaining
            const { data: prescription } = await supabase
                .from('prescriptions')
                .select('refills_remaining, status, expiry_date')
                .eq('id', prescription_id)
                .eq('patient_id', patient.id)
                .single()

            if (!prescription) {
                return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
            }

            if (prescription.status !== 'active') {
                return NextResponse.json({ error: 'Prescription is not active' }, { status: 400 })
            }

            if (prescription.expiry_date && new Date(prescription.expiry_date) < new Date()) {
                return NextResponse.json({ error: 'Prescription has expired' }, { status: 400 })
            }

            if (prescription.refills_remaining <= 0) {
                return NextResponse.json({ error: 'No refills remaining' }, { status: 400 })
            }

            const { data: refillRequest, error } = await supabase
                .from('prescription_refill_requests')
                .insert({
                    prescription_id,
                    patient_id: patient.id,
                    pharmacy_info,
                    notes
                })
                .select()
                .single()

            if (error) {
                console.error('Error creating refill request:', error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            return NextResponse.json({ refillRequest })

        } else if (profile.role === 'doctor') {
            // Doctor approving/denying refill
            const { data: doctor } = await supabase
                .from('doctors')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (!doctor) {
                return NextResponse.json({ error: 'Doctor record not found' }, { status: 404 })
            }

            const { refill_request_id, status, doctor_response } = body

            // Update refill request status
            const { data: updatedRequest, error } = await supabase
                .from('prescription_refill_requests')
                .update({
                    status,
                    doctor_response,
                    processed_at: new Date().toISOString(),
                    processed_by: doctor.id
                })
                .eq('id', refill_request_id)
                .select(`
                    *,
                    prescriptions(id, refills_remaining)
                `)
                .single()

            if (error) {
                console.error('Error updating refill request:', error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            // If approved, decrease refill count
            if (status === 'approved' && updatedRequest.prescriptions) {
                const { error: prescriptionError } = await supabase
                    .from('prescriptions')
                    .update({
                        refills_remaining: Math.max(0, updatedRequest.prescriptions.refills_remaining - 1)
                    })
                    .eq('id', updatedRequest.prescriptions.id)

                if (prescriptionError) {
                    console.error('Error updating prescription refills:', prescriptionError)
                }
            }

            return NextResponse.json({ refillRequest: updatedRequest })
        }

        return NextResponse.json({ error: 'Invalid role' }, { status: 403 })
    } catch (error) {
        console.error('Error in prescription refills POST API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}