import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import emailService from '@/lib/sendgrid'

export async function POST(request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, to, data: emailData } = body

    if (!type || !to) {
      return NextResponse.json({ error: 'Missing required fields: type and to' }, { status: 400 })
    }

    let result

    switch (type) {
      case 'appointment-confirmation':
        if (!emailData?.patientName || !emailData?.doctorName || !emailData?.appointmentDate || !emailData?.appointmentTime) {
          return NextResponse.json({ error: 'Missing appointment confirmation data' }, { status: 400 })
        }
        result = await emailService.sendAppointmentConfirmation({
          to,
          patientName: emailData.patientName,
          doctorName: emailData.doctorName,
          appointmentDate: emailData.appointmentDate,
          appointmentTime: emailData.appointmentTime
        })
        break

      case 'appointment-reminder':
        if (!emailData?.patientName || !emailData?.doctorName || !emailData?.appointmentDate || !emailData?.appointmentTime) {
          return NextResponse.json({ error: 'Missing appointment reminder data' }, { status: 400 })
        }
        result = await emailService.sendAppointmentReminder({
          to,
          patientName: emailData.patientName,
          doctorName: emailData.doctorName,
          appointmentDate: emailData.appointmentDate,
          appointmentTime: emailData.appointmentTime
        })
        break

      case 'welcome':
        if (!emailData?.userName) {
          return NextResponse.json({ error: 'Missing welcome email data' }, { status: 400 })
        }
        result = await emailService.sendWelcomeEmail({
          to,
          userName: emailData.userName
        })
        break

      case 'password-reset':
        if (!emailData?.resetLink) {
          return NextResponse.json({ error: 'Missing password reset data' }, { status: 400 })
        }
        result = await emailService.sendPasswordReset({
          to,
          resetLink: emailData.resetLink,
          userName: emailData.userName || ''
        })
        break

      case 'doctor_invitation':
        if (!emailData?.doctor_name || !emailData?.admin_name || !emailData?.specialization || 
            !emailData?.temporary_password || !emailData?.login_url) {
          return NextResponse.json({ error: 'Missing doctor invitation data' }, { status: 400 })
        }
        result = await emailService.sendDoctorInvitation({
          to,
          doctorName: emailData.doctor_name,
          adminName: emailData.admin_name,
          specialization: emailData.specialization,
          temporaryPassword: emailData.temporary_password,
          loginUrl: emailData.login_url,
          dashboardUrl: emailData.dashboard_url
        })
        break

      case 'custom':
        if (!emailData?.subject || !emailData?.html) {
          return NextResponse.json({ error: 'Missing custom email data' }, { status: 400 })
        }
        result = await emailService.sendEmail({
          to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
      message: 'Email sent successfully' 
    })

  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json({ 
      error: 'Failed to send email',
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET(request) {
  return NextResponse.json({ 
    message: 'Email API is running',
    supportedTypes: [
      'appointment-confirmation',
      'appointment-reminder', 
      'welcome',
      'password-reset',
      'doctor_invitation',
      'custom'
    ]
  })
}