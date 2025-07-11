import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const unreadOnly = searchParams.get('unreadOnly') === 'true'
        const limit = parseInt(searchParams.get('limit')) || 50

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (unreadOnly) {
            query = query.eq('is_read', false)
        }

        const { data: notifications, error } = await query

        if (error) {
            console.error('Error fetching notifications:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Get unread count
        const { count: unreadCount } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false)

        return NextResponse.json({ 
            notifications: notifications || [], 
            unreadCount: unreadCount || 0 
        })
    } catch (error) {
        console.error('Error in notifications API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request) {
    try {
        const supabase = await createClient()
        const { notification_ids, mark_all = false } = await request.json()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let query = supabase
            .from('notifications')
            .update({ 
                is_read: true, 
                updated_at: new Date().toISOString() 
            })
            .eq('user_id', user.id)

        if (mark_all) {
            // Mark all notifications as read
            query = query.eq('is_read', false)
        } else if (notification_ids && notification_ids.length > 0) {
            // Mark specific notifications as read
            query = query.in('id', notification_ids)
        } else {
            return NextResponse.json({ error: 'No notifications specified' }, { status: 400 })
        }

        const { error } = await query

        if (error) {
            console.error('Error updating notifications:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ message: 'Notifications updated successfully' })
    } catch (error) {
        console.error('Error in notifications PATCH API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const supabase = await createClient()
        const { user_id, type, title, message, metadata } = await request.json()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user profile to check if they can send notifications
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (!profile || profile.role !== 'doctor') {
            return NextResponse.json({ error: 'Only doctors can send notifications' }, { status: 403 })
        }

        const { data: notification, error } = await supabase
            .from('notifications')
            .insert({
                user_id,
                type,
                title,
                message,
                metadata
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating notification:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ notification })
    } catch (error) {
        console.error('Error in notifications POST API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}