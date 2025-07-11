-- Migration: Complete appointment system functionality
-- Run date: 2025-01-11

-- Function to generate time slots for doctors
CREATE OR REPLACE FUNCTION generate_time_slots(
  input_doctor_id UUID,
  start_date DATE,
  end_date DATE
) RETURNS INTEGER AS $$
DECLARE
  current_loop_date DATE;
  slot_time TIME;
  slot_count INTEGER := 0;
BEGIN
  current_loop_date := start_date;
  
  -- Loop through each date
  WHILE current_loop_date <= end_date LOOP
    -- Skip weekends (assuming clinic operates Mon-Fri)
    IF EXTRACT(DOW FROM current_loop_date) BETWEEN 1 AND 5 THEN
      
      -- Generate slots from 8:00 AM to 5:00 PM, every 1.5 hours
      slot_time := '08:00:00';
      
      WHILE slot_time <= '17:00:00' LOOP
        -- Only insert if slot doesn't already exist
        INSERT INTO time_slots (doctor_id, date, start_time, end_time, max_capacity, current_bookings, is_available)
        SELECT 
          input_doctor_id,
          current_loop_date,
          slot_time,
          slot_time + INTERVAL '1 hour 30 minutes',
          5,
          0,
          true
        WHERE NOT EXISTS (
          SELECT 1 FROM time_slots 
          WHERE doctor_id = input_doctor_id 
          AND date = current_loop_date 
          AND start_time = slot_time
        );
        
        slot_count := slot_count + 1;
        slot_time := slot_time + INTERVAL '1 hour 30 minutes';
      END LOOP;
      
    END IF;
    
    current_loop_date := current_loop_date + 1;
  END LOOP;
  
  RETURN slot_count;
END;
$$ LANGUAGE plpgsql;

-- Create view for appointment details with joins
CREATE OR REPLACE VIEW appointment_details AS
SELECT 
  a.id,
  a.medical_condition,
  a.status,
  a.notes,
  a.created_at,
  a.updated_at,
  p.full_name as patient_name,
  p.email as patient_email,
  p.phone as patient_phone,
  p.date_of_birth as patient_dob,
  d.name as doctor_name,
  d.specialization as doctor_specialization,
  d.email as doctor_email,
  ts.date as appointment_date,
  ts.start_time,
  ts.end_time,
  ts.max_capacity,
  ts.current_bookings
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
JOIN time_slots ts ON a.time_slot_id = ts.id;

-- Generate initial time slots for next 30 days for existing doctors
DO $$
DECLARE
  doctor_record RECORD;
BEGIN
  FOR doctor_record IN SELECT id FROM doctors LOOP
    PERFORM generate_time_slots(
      doctor_record.id,
      CURRENT_DATE,
      (CURRENT_DATE + INTERVAL '30 days')::DATE
    );
  END LOOP;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_appointment_details_patient_date ON appointments USING btree (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointment_details_doctor_date ON appointments USING btree (doctor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_slots_date_available ON time_slots USING btree (date, is_available) WHERE is_available = true;

-- Update the trigger function to properly handle availability
CREATE OR REPLACE FUNCTION update_slot_bookings()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE time_slots 
    SET current_bookings = current_bookings + 1,
        is_available = CASE WHEN current_bookings + 1 < max_capacity THEN true ELSE false END
    WHERE id = NEW.time_slot_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE time_slots 
    SET current_bookings = GREATEST(current_bookings - 1, 0),
        is_available = true
    WHERE id = OLD.time_slot_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;