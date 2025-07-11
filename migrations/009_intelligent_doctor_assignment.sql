-- Migration: Intelligent Doctor Assignment System
-- Run date: 2025-01-11

-- Add specialization keywords for better matching
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS specialization_keywords TEXT[];
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS conditions_treated TEXT[];

-- Update existing doctors with keywords and conditions
UPDATE doctors SET 
    specialization_keywords = CASE 
        WHEN specialization ILIKE '%cardiology%' THEN ARRAY['heart', 'cardiac', 'chest pain', 'blood pressure', 'cardiovascular', 'hypertension', 'arrhythmia']
        WHEN specialization ILIKE '%dermatology%' THEN ARRAY['skin', 'rash', 'acne', 'moles', 'eczema', 'psoriasis', 'dermatitis', 'allergic reaction']
        WHEN specialization ILIKE '%pediatrics%' THEN ARRAY['child', 'kids', 'baby', 'infant', 'vaccination', 'growth', 'development', 'fever in child']
        WHEN specialization ILIKE '%orthopedics%' THEN ARRAY['bone', 'joint', 'fracture', 'back pain', 'knee pain', 'shoulder', 'arthritis', 'sports injury']
        WHEN specialization ILIKE '%general%' THEN ARRAY['checkup', 'general', 'routine', 'common cold', 'flu', 'headache', 'fatigue', 'wellness']
        ELSE ARRAY['general', 'consultation']
    END,
    conditions_treated = CASE 
        WHEN specialization ILIKE '%cardiology%' THEN ARRAY['Heart Disease', 'High Blood Pressure', 'Chest Pain', 'Heart Attack', 'Arrhythmia', 'Heart Failure']
        WHEN specialization ILIKE '%dermatology%' THEN ARRAY['Skin Rash', 'Acne', 'Eczema', 'Psoriasis', 'Skin Cancer', 'Allergic Reactions']
        WHEN specialization ILIKE '%pediatrics%' THEN ARRAY['Child Checkup', 'Vaccination', 'Growth Issues', 'Child Fever', 'Behavioral Issues', 'Development Delays']
        WHEN specialization ILIKE '%orthopedics%' THEN ARRAY['Back Pain', 'Joint Pain', 'Fractures', 'Sports Injuries', 'Arthritis', 'Knee Problems']
        WHEN specialization ILIKE '%general%' THEN ARRAY['General Checkup', 'Common Cold', 'Flu', 'Headaches', 'Fatigue', 'Routine Care']
        ELSE ARRAY['General Consultation', 'Health Assessment']
    END
WHERE specialization_keywords IS NULL OR conditions_treated IS NULL;

-- Create function to find best doctor for a condition
CREATE OR REPLACE FUNCTION find_best_doctor_for_condition(
    condition_text TEXT,
    preferred_date DATE DEFAULT NULL,
    preferred_time TIME DEFAULT NULL
)
RETURNS TABLE (
    doctor_id UUID,
    doctor_name TEXT,
    specialization TEXT,
    match_score INTEGER,
    available_slots_count INTEGER,
    earliest_available_date DATE
) AS $$
DECLARE
    search_keywords TEXT[];
    condition_lower TEXT;
BEGIN
    condition_lower := LOWER(condition_text);
    
    -- Extract keywords from the condition
    search_keywords := string_to_array(
        regexp_replace(condition_lower, '[^a-zA-Z0-9\s]', ' ', 'g'), 
        ' '
    );
    
    -- Remove empty strings and common words
    search_keywords := array_remove(search_keywords, '');
    search_keywords := ARRAY(
        SELECT unnest(search_keywords) 
        WHERE unnest(search_keywords) NOT IN ('a', 'an', 'the', 'is', 'in', 'on', 'at', 'for', 'with', 'and', 'or', 'but')
    );

    RETURN QUERY
    WITH doctor_matches AS (
        SELECT 
            d.id,
            d.name,
            d.specialization,
            -- Calculate match score based on keyword matches
            (
                -- Exact specialization match gets high score
                CASE WHEN condition_lower ILIKE '%' || LOWER(d.specialization) || '%' THEN 100 ELSE 0 END +
                -- Keyword matches in specialization_keywords
                (
                    SELECT COUNT(*) * 20
                    FROM unnest(d.specialization_keywords) AS keyword
                    WHERE condition_lower ILIKE '%' || keyword || '%'
                ) +
                -- Condition matches in conditions_treated
                (
                    SELECT COUNT(*) * 30
                    FROM unnest(d.conditions_treated) AS treated_condition
                    WHERE condition_lower ILIKE '%' || LOWER(treated_condition) || '%'
                ) +
                -- General medicine gets base score for any condition
                CASE WHEN d.specialization ILIKE '%general%' THEN 10 ELSE 0 END
            ) AS score
        FROM doctors d
        WHERE d.is_active = true
    ),
    doctor_availability AS (
        SELECT 
            dm.id,
            dm.name,
            dm.specialization,
            dm.score,
            COUNT(ts.id) FILTER (
                WHERE ts.is_available = true 
                AND ts.current_bookings < ts.max_capacity
                AND ts.date >= COALESCE(preferred_date, CURRENT_DATE)
                AND ts.date <= COALESCE(preferred_date, CURRENT_DATE + INTERVAL '14 days')
            ) as available_slots,
            MIN(ts.date) FILTER (
                WHERE ts.is_available = true 
                AND ts.current_bookings < ts.max_capacity
                AND ts.date >= CURRENT_DATE
            ) as earliest_date
        FROM doctor_matches dm
        LEFT JOIN time_slots ts ON dm.id = ts.doctor_id
        GROUP BY dm.id, dm.name, dm.specialization, dm.score
    )
    SELECT 
        da.id,
        da.name,
        da.specialization,
        da.score,
        da.available_slots,
        da.earliest_date
    FROM doctor_availability da
    WHERE da.available_slots > 0 OR da.score >= 50  -- Include high-match doctors even if no immediate availability
    ORDER BY 
        da.score DESC,           -- Best match first
        da.available_slots DESC, -- More availability second
        da.earliest_date ASC     -- Earlier availability third
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-assign doctor and create time slots
CREATE OR REPLACE FUNCTION auto_assign_doctor_and_slots(
    condition_text TEXT,
    preferred_date DATE DEFAULT NULL
)
RETURNS TABLE (
    assigned_doctor_id UUID,
    assigned_doctor_name TEXT,
    match_reason TEXT,
    available_slots JSONB
) AS $$
DECLARE
    best_doctor RECORD;
    slot_record RECORD;
    slots_json JSONB := '[]'::JSONB;
    slot_obj JSONB;
BEGIN
    -- Find the best doctor
    SELECT * INTO best_doctor
    FROM find_best_doctor_for_condition(condition_text, preferred_date)
    LIMIT 1;
    
    IF best_doctor.doctor_id IS NULL THEN
        RAISE EXCEPTION 'No available doctors found for this condition';
    END IF;
    
    -- Ensure time slots exist for the next 14 days for this doctor
    PERFORM create_time_slots_for_doctor(
        best_doctor.doctor_id, 
        COALESCE(preferred_date, CURRENT_DATE),
        COALESCE(preferred_date, CURRENT_DATE) + INTERVAL '14 days'
    );
    
    -- Get available time slots for the assigned doctor
    FOR slot_record IN 
        SELECT 
            ts.id,
            ts.date,
            ts.start_time,
            ts.end_time,
            ts.current_bookings,
            ts.max_capacity
        FROM time_slots ts
        WHERE ts.doctor_id = best_doctor.doctor_id
        AND ts.is_available = true
        AND ts.current_bookings < ts.max_capacity
        AND ts.date >= COALESCE(preferred_date, CURRENT_DATE)
        AND ts.date <= COALESCE(preferred_date, CURRENT_DATE) + INTERVAL '14 days'
        ORDER BY ts.date, ts.start_time
        LIMIT 20
    LOOP
        slot_obj := jsonb_build_object(
            'id', slot_record.id,
            'date', slot_record.date,
            'start_time', slot_record.start_time,
            'end_time', slot_record.end_time,
            'current_bookings', slot_record.current_bookings,
            'max_capacity', slot_record.max_capacity
        );
        slots_json := slots_json || slot_obj;
    END LOOP;
    
    RETURN QUERY SELECT 
        best_doctor.doctor_id,
        best_doctor.doctor_name,
        CASE 
            WHEN best_doctor.match_score >= 100 THEN 'Perfect match for your condition'
            WHEN best_doctor.match_score >= 50 THEN 'Good match for your condition'
            WHEN best_doctor.match_score >= 20 THEN 'Can treat your condition'
            ELSE 'General practitioner available'
        END,
        slots_json;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate time slots for a doctor over a date range
CREATE OR REPLACE FUNCTION create_time_slots_for_doctor(
    doctor_uuid UUID,
    start_date DATE,
    end_date DATE
)
RETURNS INTEGER AS $$
DECLARE
    current_date DATE;
    slot_count INTEGER := 0;
    time_slots TIME[] := ARRAY['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00'];
    slot_time TIME;
BEGIN
    current_date := start_date;
    
    WHILE current_date <= end_date LOOP
        -- Skip weekends (optional - remove if doctors work weekends)
        IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
            FOREACH slot_time IN ARRAY time_slots LOOP
                INSERT INTO time_slots (
                    doctor_id, 
                    date, 
                    start_time, 
                    end_time, 
                    max_capacity,
                    current_bookings,
                    is_available
                ) VALUES (
                    doctor_uuid,
                    current_date,
                    slot_time,
                    slot_time + INTERVAL '1.5 hours',
                    5,  -- Default capacity
                    0,
                    true
                )
                ON CONFLICT (doctor_id, date, start_time) DO NOTHING;
                
                slot_count := slot_count + 1;
            END LOOP;
        END IF;
        
        current_date := current_date + INTERVAL '1 day';
    END LOOP;
    
    RETURN slot_count;
END;
$$ LANGUAGE plpgsql;