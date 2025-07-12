import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ hasAccess: false, error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user has admin permissions using the user groups system
    const { data: permissions, error: permError } = await supabase
      .rpc('user_has_permission', {
        user_uuid: user.id,
        permission_name: 'can_access_admin_panel'
      })

    if (permError) {
      console.error('Error checking permissions:', permError)
      return NextResponse.json({ hasAccess: false, error: 'Permission check failed' }, { status: 500 })
    }

    return NextResponse.json({ 
      hasAccess: permissions,
      userId: user.id,
      email: user.email 
    })

  } catch (error) {
    console.error('Admin access check error:', error)
    return NextResponse.json({ 
      hasAccess: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}