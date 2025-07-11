import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user profile to verify they're a patient
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (!profile || profile.role !== 'patient') {
            return NextResponse.json({ error: 'Only patients can view doctor list' }, { status: 403 })
        }

        // Fetch all active doctors
        const { data: doctors, error } = await supabase
            .from('doctors')
            .select('*')
            .eq('is_active', true)
            .order('name')

        if (error) {
            console.error('Error fetching doctors:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ doctors: doctors || [] })
    } catch (error) {
        console.error('Error in doctors API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}