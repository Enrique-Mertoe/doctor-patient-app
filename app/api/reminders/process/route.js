import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const supabase = await createClient()

        // Check for authorization (this could be called by a cron job or admin)
        const { authorization } = request.headers || {}
        const apiKey = authorization?.replace('Bearer ', '')
        
        // Simple API key check - in production, use proper authentication
        if (apiKey !== process.env.REMINDER_API_KEY && apiKey !== 'dev-reminder-key') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Call the database function to process due reminders
        const { data, error } = await supabase.rpc('process_due_reminders')

        if (error) {
            console.error('Error processing reminders:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ 
            message: `Processed ${data || 0} reminders`,
            processedCount: data || 0
        })
    } catch (error) {
        console.error('Error in reminder processing API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Manual trigger endpoint for testing
export async function GET(request) {
    try {
        const supabase = await createClient()

        // Get current user and check if they're an admin/doctor
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (!profile || profile.role !== 'doctor') {
            return NextResponse.json({ error: 'Only doctors can manually process reminders' }, { status: 403 })
        }

        // Get pending reminders for display
        const { data: pendingReminders, error: reminderError } = await supabase
            .from('reminders')
            .select(`
                *,
                appointments!inner(
                    medical_condition,
                    patients(full_name),
                    doctors(name),
                    time_slots(date, start_time)
                )
            `)
            .eq('is_sent', false)
            .lte('scheduled_for', new Date().toISOString())
            .order('scheduled_for', { ascending: true })

        if (reminderError) {
            console.error('Error fetching pending reminders:', reminderError)
            return NextResponse.json({ error: reminderError.message }, { status: 500 })
        }

        // Process the reminders
        const { data: processedCount, error: processError } = await supabase.rpc('process_due_reminders')

        if (processError) {
            console.error('Error processing reminders:', processError)
            return NextResponse.json({ error: processError.message }, { status: 500 })
        }

        return NextResponse.json({
            message: `Processed ${processedCount || 0} reminders`,
            processedCount: processedCount || 0,
            pendingReminders: pendingReminders || []
        })
    } catch (error) {
        console.error('Error in reminder processing GET API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}