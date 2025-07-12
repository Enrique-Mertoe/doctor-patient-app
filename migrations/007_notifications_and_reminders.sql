-- Migration: Add notifications and reminders system
-- Run date: 2025-01-11

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('appointment_reminder', 'appointment_update', 'prescription_reminder', 'system_alert')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('appointment_24h', 'appointment_2h', 'appointment_30m', 'prescription_refill')),
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_appointment_id ON reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_for ON reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_reminders_is_sent ON reminders(is_sent);

-- Function to automatically create appointment reminders
CREATE OR REPLACE FUNCTION create_appointment_reminders()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create reminders for scheduled appointments
    IF NEW.status = 'scheduled' THEN
        -- Get appointment date and time
        DECLARE
            appointment_datetime TIMESTAMP WITH TIME ZONE;
        BEGIN
            SELECT 
                (ts.date + ts.start_time::TIME)::TIMESTAMP WITH TIME ZONE
            INTO appointment_datetime
            FROM time_slots ts
            WHERE ts.id = NEW.time_slot_id;

            -- Create 24-hour reminder
            INSERT INTO reminders (user_id, appointment_id, reminder_type, scheduled_for, message)
            SELECT 
                p.user_id,
                NEW.id,
                'appointment_24h',
                appointment_datetime - INTERVAL '24 hours',
                'You have an appointment tomorrow with Dr. ' || d.name || ' at ' || 
                to_char(appointment_datetime, 'HH12:MI AM') || '. Please arrive 15 minutes early.'
            FROM patients p, doctors d
            WHERE p.id = NEW.patient_id AND d.id = NEW.doctor_id
            AND appointment_datetime - INTERVAL '24 hours' > NOW();

            -- Create 2-hour reminder
            INSERT INTO reminders (user_id, appointment_id, reminder_type, scheduled_for, message)
            SELECT 
                p.user_id,
                NEW.id,
                'appointment_2h',
                appointment_datetime - INTERVAL '2 hours',
                'Reminder: You have an appointment with Dr. ' || d.name || ' in 2 hours at ' || 
                to_char(appointment_datetime, 'HH12:MI AM') || '. Please prepare any questions you may have.'
            FROM patients p, doctors d
            WHERE p.id = NEW.patient_id AND d.id = NEW.doctor_id
            AND appointment_datetime - INTERVAL '2 hours' > NOW();

            -- Create 30-minute reminder
            INSERT INTO reminders (user_id, appointment_id, reminder_type, scheduled_for, message)
            SELECT 
                p.user_id,
                NEW.id,
                'appointment_30m',
                appointment_datetime - INTERVAL '30 minutes',
                'Your appointment with Dr. ' || d.name || ' is in 30 minutes. Please head to the clinic now.'
            FROM patients p, doctors d
            WHERE p.id = NEW.patient_id AND d.id = NEW.doctor_id
            AND appointment_datetime - INTERVAL '30 minutes' > NOW();
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic reminder creation
DROP TRIGGER IF EXISTS create_reminders_on_appointment ON appointments;
CREATE TRIGGER create_reminders_on_appointment
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION create_appointment_reminders();

-- Function to mark reminders as sent and create notifications
CREATE OR REPLACE FUNCTION process_due_reminders()
RETURNS INTEGER AS $$
DECLARE
    reminder_record RECORD;
    processed_count INTEGER := 0;
BEGIN
    FOR reminder_record IN 
        SELECT * FROM reminders 
        WHERE scheduled_for <= NOW() 
        AND is_sent = FALSE
        ORDER BY scheduled_for ASC
    LOOP
        -- Create notification from reminder
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            metadata,
            is_read,
            created_at
        ) VALUES (
            reminder_record.user_id,
            'appointment_reminder',
            CASE 
                WHEN reminder_record.reminder_type = 'appointment_24h' THEN 'Appointment Tomorrow'
                WHEN reminder_record.reminder_type = 'appointment_2h' THEN 'Appointment in 2 Hours'
                WHEN reminder_record.reminder_type = 'appointment_30m' THEN 'Appointment in 30 Minutes'
                ELSE 'Appointment Reminder'
            END,
            reminder_record.message,
            jsonb_build_object(
                'appointment_id', reminder_record.appointment_id,
                'reminder_type', reminder_record.reminder_type
            ),
            FALSE,
            NOW()
        );

        -- Mark reminder as sent
        UPDATE reminders 
        SET is_sent = TRUE, sent_at = NOW(), updated_at = NOW()
        WHERE id = reminder_record.id;

        processed_count := processed_count + 1;
    END LOOP;

    RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old notifications and reminders
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete read notifications older than 30 days
    DELETE FROM notifications 
    WHERE is_read = TRUE 
    AND created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete sent reminders older than 7 days
    DELETE FROM reminders 
    WHERE is_sent = TRUE 
    AND sent_at < NOW() - INTERVAL '7 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;