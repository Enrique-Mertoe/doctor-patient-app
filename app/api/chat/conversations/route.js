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
            .from('chat_conversations')
            .select(`
                *,
                patients(full_name, user_id),
                doctors(name, specialization, user_id)
            `)
            .order('last_message_at', { ascending: false })

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

        const { data: conversations, error } = await query

        if (error) {
            console.error('Error fetching conversations:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ conversations: conversations || [] })
    } catch (error) {
        console.error('Error in conversations API:', error)
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

        const { other_user_id, subject, message } = body

        let patientId, doctorId

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

            // Get doctor record from other_user_id
            const { data: doctor } = await supabase
                .from('doctors')
                .select('id')
                .eq('user_id', other_user_id)
                .single()

            if (!doctor) {
                return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
            }

            patientId = patient.id
            doctorId = doctor.id
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

            // Get patient record from other_user_id
            const { data: patient } = await supabase
                .from('patients')
                .select('id')
                .eq('user_id', other_user_id)
                .single()

            if (!patient) {
                return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
            }

            patientId = patient.id
            doctorId = doctor.id
        }

        // Check if conversation already exists
        const { data: existingConversation } = await supabase
            .from('chat_conversations')
            .select('id')
            .eq('patient_id', patientId)
            .eq('doctor_id', doctorId)
            .single()

        let conversationId

        if (existingConversation) {
            conversationId = existingConversation.id
        } else {
            // Create new conversation
            const { data: newConversation, error: conversationError } = await supabase
                .from('chat_conversations')
                .insert({
                    patient_id: patientId,
                    doctor_id: doctorId,
                    subject: subject || 'General Inquiry'
                })
                .select('id')
                .single()

            if (conversationError) {
                console.error('Error creating conversation:', conversationError)
                return NextResponse.json({ error: conversationError.message }, { status: 500 })
            }

            conversationId = newConversation.id
        }

        // Add first message if provided
        if (message) {
            const { error: messageError } = await supabase
                .from('chat_messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    sender_type: profile.role,
                    message_text: message
                })

            if (messageError) {
                console.error('Error creating message:', messageError)
                return NextResponse.json({ error: messageError.message }, { status: 500 })
            }
        }

        // Fetch the complete conversation data
        const { data: conversation, error: fetchError } = await supabase
            .from('chat_conversations')
            .select(`
                *,
                patients(full_name, user_id),
                doctors(name, specialization, user_id)
            `)
            .eq('id', conversationId)
            .single()

        if (fetchError) {
            console.error('Error fetching conversation:', fetchError)
            return NextResponse.json({ error: fetchError.message }, { status: 500 })
        }

        return NextResponse.json({ conversation })
    } catch (error) {
        console.error('Error in conversations POST API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}