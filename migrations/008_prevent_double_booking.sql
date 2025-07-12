-- Migration: Prevent double booking constraints
-- Run date: 2025-01-11

-- Add unique constraint to prevent patient from booking the same time slot twice
-- This ensures no patient can have multiple appointments at the same exact time slot
ALTER TABLE appointments 
ADD CONSTRAINT unique_patient_timeslot 
UNIQUE (patient_id, time_slot_id);

-- Add unique constraint to prevent multiple patients booking the same doctor at overlapping times
-- This is handled by the max_capacity in time_slots, but we add this as extra protection
-- Note: This constraint allows multiple patients per time slot (as intended for group appointments)
-- but prevents the exact same patient from booking twice

-- Create function to check for appointment time conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflicts()
RETURNS TRIGGER AS $$
DECLARE
    conflict_count INTEGER;
    slot_info RECORD;
BEGIN
    -- Get the time slot information
    SELECT date, start_time, end_time, doctor_id
    INTO slot_info
    FROM time_slots
    WHERE id = NEW.time_slot_id;

    -- Check for overlapping appointments for the same patient on the same day
    SELECT COUNT(*)
    INTO conflict_count
    FROM appointments a
    JOIN time_slots ts ON a.time_slot_id = ts.id
    WHERE a.patient_id = NEW.patient_id
    AND a.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND a.status != 'cancelled'
    AND ts.date = slot_info.date
    AND (
        -- Check if the new appointment overlaps with existing ones
        (ts.start_time < (slot_info.start_time::time + slot_info.end_time::time - slot_info.start_time::time)) 
        AND 
        (ts.end_time > slot_info.start_time)
    );

    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'Patient already has an appointment during this time period';
    END IF;

    -- Check if the time slot has capacity (additional safety check)
    SELECT current_bookings, max_capacity
    INTO slot_info
    FROM time_slots
    WHERE id = NEW.time_slot_id;

    IF slot_info.current_bookings >= slot_info.max_capacity THEN
        RAISE EXCEPTION 'Time slot is at maximum capacity';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce appointment conflict checking
DROP TRIGGER IF EXISTS check_conflicts_before_insert ON appointments;
CREATE TRIGGER check_conflicts_before_insert
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION check_appointment_conflicts();

DROP TRIGGER IF EXISTS check_conflicts_before_update ON appointments;
CREATE TRIGGER check_conflicts_before_update
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    WHEN (OLD.time_slot_id IS DISTINCT FROM NEW.time_slot_id OR OLD.patient_id IS DISTINCT FROM NEW.patient_id)
    EXECUTE FUNCTION check_appointment_conflicts();

-- Function to update time slot booking count when appointments are created/updated
CREATE OR REPLACE FUNCTION update_slot_booking_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment booking count for new appointment
        UPDATE time_slots 
        SET current_bookings = current_bookings + 1,
            is_available = CASE 
                WHEN current_bookings + 1 >= max_capacity THEN false 
                ELSE true 
            END
        WHERE id = NEW.time_slot_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
            -- Appointment was cancelled, decrease count
            UPDATE time_slots 
            SET current_bookings = GREATEST(current_bookings - 1, 0),
                is_available = true
            WHERE id = NEW.time_slot_id;
        ELSIF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
            -- Appointment was reactivated, increase count
            UPDATE time_slots 
            SET current_bookings = current_bookings + 1,
                is_available = CASE 
                    WHEN current_bookings + 1 >= max_capacity THEN false 
                    ELSE true 
                END
            WHERE id = NEW.time_slot_id;
        END IF;
        
        -- Handle time slot changes
        IF OLD.time_slot_id != NEW.time_slot_id AND NEW.status != 'cancelled' THEN
            -- Decrease count from old slot
            UPDATE time_slots 
            SET current_bookings = GREATEST(current_bookings - 1, 0),
                is_available = true
            WHERE id = OLD.time_slot_id;
            
            -- Increase count for new slot
            UPDATE time_slots 
            SET current_bookings = current_bookings + 1,
                is_available = CASE 
                    WHEN current_bookings + 1 >= max_capacity THEN false 
                    ELSE true 
                END
            WHERE id = NEW.time_slot_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrease booking count when appointment is deleted
        IF OLD.status != 'cancelled' THEN
            UPDATE time_slots 
            SET current_bookings = GREATEST(current_bookings - 1, 0),
                is_available = true
            WHERE id = OLD.time_slot_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic booking count management
DROP TRIGGER IF EXISTS update_booking_count_insert ON appointments;
CREATE TRIGGER update_booking_count_insert
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_slot_booking_count();

DROP TRIGGER IF EXISTS update_booking_count_update ON appointments;
CREATE TRIGGER update_booking_count_update
    AFTER UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_slot_booking_count();

DROP TRIGGER IF EXISTS update_booking_count_delete ON appointments;
CREATE TRIGGER update_booking_count_delete
    AFTER DELETE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_slot_booking_count();

-- Function to recalculate booking counts (for data cleanup/verification)
CREATE OR REPLACE FUNCTION recalculate_slot_booking_counts()
RETURNS INTEGER AS $$
DECLARE
    slot_record RECORD;
    updated_count INTEGER := 0;
BEGIN
    FOR slot_record IN 
        SELECT id FROM time_slots
    LOOP
        UPDATE time_slots 
        SET current_bookings = (
            SELECT COUNT(*)
            FROM appointments
            WHERE time_slot_id = slot_record.id
            AND status != 'cancelled'
        ),
        is_available = (
            (SELECT COUNT(*)
             FROM appointments
             WHERE time_slot_id = slot_record.id
             AND status != 'cancelled'
            ) < max_capacity
        )
        WHERE id = slot_record.id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;