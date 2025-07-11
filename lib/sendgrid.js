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
  }
}

module.exports = emailService