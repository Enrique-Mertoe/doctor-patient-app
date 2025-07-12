-- Migration: Activity Logs System
-- Run date: 2025-01-11

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    activity_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_type_date ON activity_logs(user_id, activity_type, created_at DESC);

-- Create RLS policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs" ON activity_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_group_memberships ugm
            JOIN user_groups ug ON ugm.group_id = ug.id
            WHERE ugm.user_id = auth.uid()
            AND ug.name = 'admin'
        )
    );

-- Policy: Users can view their own activity logs
CREATE POLICY "Users can view their own activity logs" ON activity_logs
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_activity_type VARCHAR(100),
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO activity_logs (
        user_id,
        activity_type,
        description,
        metadata,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_activity_type,
        p_description,
        p_metadata,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent activities for admin dashboard
CREATE OR REPLACE FUNCTION get_recent_activities(
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_email TEXT,
    activity_type VARCHAR(100),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.user_id,
        u.email as user_email,
        al.activity_type,
        al.description,
        al.metadata,
        al.created_at
    FROM activity_logs al
    LEFT JOIN auth.users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically log certain activities

-- Trigger function for user registration
CREATE OR REPLACE FUNCTION trigger_log_user_registration()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_activity(
        NEW.id,
        'user_registration',
        'New user registered',
        jsonb_build_object(
            'email', NEW.email,
            'email_confirmed', NEW.email_confirmed_at IS NOT NULL
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user registration
DROP TRIGGER IF EXISTS tr_log_user_registration ON auth.users;
CREATE TRIGGER tr_log_user_registration
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_log_user_registration();

-- Trigger function for appointment booking
CREATE OR REPLACE FUNCTION trigger_log_appointment_booking()
RETURNS TRIGGER AS $$
DECLARE
    doctor_name TEXT;
    patient_name TEXT;
BEGIN
    -- Get doctor and patient names
    SELECT name INTO doctor_name FROM doctors WHERE id = NEW.doctor_id;
    SELECT name INTO patient_name FROM patients WHERE user_id = NEW.patient_id;
    
    PERFORM log_activity(
        NEW.patient_id,
        'appointment_booked',
        'Appointment booked with ' || COALESCE(doctor_name, 'Unknown Doctor'),
        jsonb_build_object(
            'appointment_id', NEW.id,
            'doctor_id', NEW.doctor_id,
            'doctor_name', doctor_name,
            'patient_name', patient_name,
            'appointment_date', NEW.appointment_date,
            'appointment_time', NEW.appointment_time,
            'status', NEW.status
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for appointment booking (if appointments table exists)
-- Note: This will only work if the appointments table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appointments') THEN
        DROP TRIGGER IF EXISTS tr_log_appointment_booking ON appointments;
        CREATE TRIGGER tr_log_appointment_booking
            AFTER INSERT ON appointments
            FOR EACH ROW
            EXECUTE FUNCTION trigger_log_appointment_booking();
    END IF;
END $$;

-- Trigger function for doctor creation
CREATE OR REPLACE FUNCTION trigger_log_doctor_creation()
RETURNS TRIGGER AS $$
DECLARE
    admin_email TEXT;
BEGIN
    -- Get admin email
    SELECT email INTO admin_email FROM auth.users WHERE id = NEW.created_by;
    
    PERFORM log_activity(
        NEW.created_by,
        'doctor_created',
        'New doctor profile created: ' || NEW.name,
        jsonb_build_object(
            'doctor_id', NEW.id,
            'doctor_name', NEW.name,
            'doctor_email', NEW.email,
            'specialization', NEW.specialization,
            'created_by_email', admin_email
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for doctor creation
DROP TRIGGER IF EXISTS tr_log_doctor_creation ON doctors;
CREATE TRIGGER tr_log_doctor_creation
    AFTER INSERT ON doctors
    FOR EACH ROW
    EXECUTE FUNCTION trigger_log_doctor_creation();

-- Add some sample activity logs for testing
INSERT INTO activity_logs (user_id, activity_type, description, metadata, created_at) VALUES
(NULL, 'system_backup', 'System backup completed successfully', '{"backup_size": "2.4GB", "duration": "15 minutes"}', NOW() - INTERVAL '3 hours'),
(NULL, 'system_maintenance', 'Database optimization completed', '{"tables_optimized": 12, "performance_gain": "15%"}', NOW() - INTERVAL '6 hours'),
(NULL, 'system_update', 'Security patches applied', '{"patches_applied": 5, "restart_required": false}', NOW() - INTERVAL '1 day');

COMMENT ON TABLE activity_logs IS 'System activity logs for audit trail and admin dashboard';
COMMENT ON COLUMN activity_logs.activity_type IS 'Type of activity (user_registration, appointment_booked, doctor_created, etc.)';
COMMENT ON COLUMN activity_logs.description IS 'Human-readable description of the activity';
COMMENT ON COLUMN activity_logs.metadata IS 'Additional structured data about the activity';