import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user has admin permissions
    const { data: hasAccess } = await supabase
      .rpc('user_has_permission', {
        user_uuid: user.id,
        permission_name: 'can_manage_doctors'
      })

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Fetch recent activities using the database function
    const { data: activities, error: activitiesError } = await supabase
      .rpc('get_recent_activities', { limit_count: limit })

    if (activitiesError) {
      throw activitiesError
    }

    // Format activities for display
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.activity_type,
      description: activity.description,
      user_email: activity.user_email,
      metadata: activity.metadata,
      created_at: activity.created_at,
      time_ago: getTimeAgo(new Date(activity.created_at))
    }))

    return NextResponse.json({ activities: formattedActivities })

  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch activities' 
    }, { status: 500 })
  }
}

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date()
  const diffInMs = now - date
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 1) {
    return 'Just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleDateString()
  }
}