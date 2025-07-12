const sgMail = require('@sendgrid/mail')

if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY not found in environment variables')
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

const emailService = {
  async sendEmail({ to, subject, html, text }) {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured')
    }

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourapp.com',
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    }

    try {
      const response = await sgMail.send(msg)
      console.log('Email sent successfully:', response[0].statusCode)
      return { success: true, messageId: response[0].headers['x-message-id'] }
    } catch (error) {
      console.error('SendGrid error:', error)
      if (error.response) {
        console.error('SendGrid response body:', error.response.body)
      }
      throw new Error(`Failed to send email: ${error.message}`)
    }
  },

  async sendAppointmentConfirmation({ to, patientName, doctorName, appointmentDate, appointmentTime }) {
    const subject = 'Appointment Confirmation'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Appointment Confirmed</h2>
        <p>Dear ${patientName},</p>
        <p>Your appointment has been confirmed with the following details:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Doctor:</strong> ${doctorName}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentTime}</p>
        </div>
        <p>Please arrive 15 minutes early for your appointment.</p>
        <p>If you need to cancel or reschedule, please contact us at least 24 hours in advance.</p>
        <p>Thank you for choosing our medical services.</p>
      </div>
    `

    return this.sendEmail({ to, subject, html })
  },

  async sendAppointmentReminder({ to, patientName, doctorName, appointmentDate, appointmentTime }) {
    const subject = 'Appointment Reminder - Tomorrow'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Appointment Reminder</h2>
        <p>Dear ${patientName},</p>
        <p>This is a friendly reminder that you have an appointment tomorrow:</p>
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Doctor:</strong> ${doctorName}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentTime}</p>
        </div>
        <p>Please arrive 15 minutes early for your appointment.</p>
        <p>If you need to cancel or reschedule, please contact us as soon as possible.</p>
      </div>
    `

    return this.sendEmail({ to, subject, html })
  },

  async sendPasswordReset({ to, resetLink, userName }) {
    const subject = 'Password Reset Request'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Password Reset Request</h2>
        <p>Hello ${userName || ''},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>This link will expire in 24 hours for security reasons.</p>
        <p style="color: #6b7280; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser: ${resetLink}
        </p>
      </div>
    `

    return this.sendEmail({ to, subject, html })
  },

  async sendWelcomeEmail({ to, userName }) {
    const subject = 'Welcome to Our Medical Platform'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Welcome to Our Medical Platform!</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for joining our medical appointment booking platform. We're excited to help you manage your healthcare needs.</p>
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #059669; margin-top: 0;">Getting Started:</h3>
          <ul style="color: #047857;">
            <li>Complete your profile setup</li>
            <li>Book your first appointment</li>
            <li>Explore your dashboard features</li>
          </ul>
        </div>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Welcome aboard!</p>
      </div>
    `

    return this.sendEmail({ to, subject, html })
  },

  async sendDoctorInvitation({ 
    to, 
    doctorName, 
    adminName, 
    specialization, 
    temporaryPassword, 
    loginUrl, 
    dashboardUrl 
  }) {
    const subject = 'Welcome to MediCare - Doctor Account Created'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to MediCare</h1>
          <p style="color: #e5e7eb; margin: 10px 0 0 0; font-size: 16px;">Your Doctor Account Has Been Created</p>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 18px; margin-bottom: 20px;">Hello Dr. ${doctorName},</p>
          
          <p>Welcome to MediCare! ${adminName} has created a doctor account for you on our medical appointment platform.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
            <h3 style="color: #667eea; margin-top: 0; margin-bottom: 15px;">Your Account Details:</h3>
            <p style="margin: 8px 0;"><strong>Name:</strong> ${doctorName}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${to}</p>
            <p style="margin: 8px 0;"><strong>Specialization:</strong> ${specialization}</p>
            <p style="margin: 8px 0;"><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${temporaryPassword}</code></p>
          </div>

          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0; margin-bottom: 15px;">⚠️ Important Security Notice:</h3>
            <p style="margin: 8px 0; color: #92400e;">Please change your password immediately after your first login for security reasons.</p>
          </div>

          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #059669; margin-top: 0; margin-bottom: 15px;">Next Steps:</h3>
            <ol style="color: #047857; margin: 0; padding-left: 20px;">
              <li style="margin: 8px 0;">Click the login button below to access your account</li>
              <li style="margin: 8px 0;">Change your temporary password</li>
              <li style="margin: 8px 0;">Complete your doctor profile</li>
              <li style="margin: 8px 0;">Set up your availability schedule</li>
              <li style="margin: 8px 0;">Start managing your appointments</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              Login to Your Account
            </a>
          </div>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #374151; margin-top: 0; margin-bottom: 15px;">Platform Features:</h3>
            <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
              <li style="margin: 5px 0;">Manage patient appointments</li>
              <li style="margin: 5px 0;">View patient medical records</li>
              <li style="margin: 5px 0;">Set availability schedules</li>
              <li style="margin: 5px 0;">Communicate with patients</li>
              <li style="margin: 5px 0;">Generate reports and analytics</li>
            </ul>
          </div>

          <p style="margin: 25px 0 15px 0;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          
          <p style="margin: 0;">Best regards,<br>
          <strong>The MediCare Team</strong></p>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; text-align: center;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            If you're having trouble with the login button, copy and paste this URL into your browser:<br>
            <a href="${loginUrl}" style="color: #667eea; word-break: break-all;">${loginUrl}</a>
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">
            This email was sent to ${to}. If you believe this was sent in error, please contact support.
          </p>
        </div>
      </div>
    `

    return this.sendEmail({ to, subject, html })
  }
}

module.exports = emailService