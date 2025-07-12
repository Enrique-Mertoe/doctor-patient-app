import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const conversationId = searchParams.get('conversationId')

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!conversationId) {
            return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
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

        // Verify user has access to this conversation
        let hasAccess = false

        if (profile.role === 'patient') {
            const { data: patient } = await supabase
                .from('patients')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (patient) {
                const { data: conversation } = await supabase
                    .from('chat_conversations')
                    .select('id')
                    .eq('id', conversationId)
                    .eq('patient_id', patient.id)
                    .single()

                hasAccess = !!conversation
            }
        } else if (profile.role === 'doctor') {
            const { data: doctor } = await supabase
                .from('doctors')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (doctor) {
                const { data: conversation } = await supabase
                    .from('chat_conversations')
                    .select('id')
                    .eq('id', conversationId)
                    .eq('doctor_id', doctor.id)
                    .single()

                hasAccess = !!conversation
            }
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        // Fetch messages
        const { data: messages, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching messages:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Mark messages as read for the current user
        await supabase
            .from('chat_messages')
            .update({ 
                is_read: true, 
                read_at: new Date().toISOString() 
            })
            .eq('conversation_id', conversationId)
            .neq('sender_id', user.id)
            .eq('is_read', false)

        return NextResponse.json({ messages: messages || [] })
    } catch (error) {
        console.error('Error in messages GET API:', error)
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

        const { conversation_id, message_text, message_type = 'text', attachments } = body

        if (!conversation_id || !message_text) {
            return NextResponse.json({ error: 'Conversation ID and message text required' }, { status: 400 })
        }

        // Verify user has access to this conversation
        let hasAccess = false

        if (profile.role === 'patient') {
            const { data: patient } = await supabase
                .from('patients')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (patient) {
                const { data: conversation } = await supabase
                    .from('chat_conversations')
                    .select('id')
                    .eq('id', conversation_id)
                    .eq('patient_id', patient.id)
                    .single()

                hasAccess = !!conversation
            }
        } else if (profile.role === 'doctor') {
            const { data: doctor } = await supabase
                .from('doctors')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (doctor) {
                const { data: conversation } = await supabase
                    .from('chat_conversations')
                    .select('id')
                    .eq('id', conversation_id)
                    .eq('doctor_id', doctor.id)
                    .single()

                hasAccess = !!conversation
            }
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        // Create message
        const { data: message, error } = await supabase
            .from('chat_messages')
            .insert({
                conversation_id,
                sender_id: user.id,
                sender_type: profile.role,
                message_text,
                message_type,
                attachments
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating message:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ message })
    } catch (error) {
        console.error('Error in messages POST API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}