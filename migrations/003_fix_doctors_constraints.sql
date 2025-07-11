-- Migration: Fix doctors table constraints for user registration
-- Run date: 2025-01-11

-- Add unique constraint on user_id for doctors table
ALTER TABLE doctors ADD CONSTRAINT doctors_user_id_unique UNIQUE (user_id);

-- Add unique constraint on profile_id for doctors table  
ALTER TABLE doctors ADD CONSTRAINT doctors_profile_id_unique UNIQUE (profile_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_doctors_profile_id ON doctors(profile_id) WHERE profile_id IS NOT NULL;

-- Transaction function for onboarding to ensure data consistency
CREATE OR REPLACE FUNCTION onboard_user_transaction(
  p_user_id UUID,
  p_role VARCHAR,
  p_full_name VARCHAR,
  p_email VARCHAR,
  p_phone VARCHAR DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL,
  p_emergency_contact_name VARCHAR DEFAULT NULL,
  p_emergency_contact_phone VARCHAR DEFAULT NULL,
  p_medical_history TEXT DEFAULT NULL,
  p_allergies TEXT DEFAULT NULL,
  p_current_medications TEXT DEFAULT NULL,
  p_specialization VARCHAR DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_profile_id UUID;
  v_result JSON;
BEGIN
  -- Start transaction (implicit in function)
  
  -- Step 1: Create or update user profile
  INSERT INTO user_profiles (
    user_id, role, full_name, email, phone, onboarding_completed
  ) VALUES (
    p_user_id, p_role, p_full_name, p_email, p_phone, true
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    onboarding_completed = EXCLUDED.onboarding_completed,
    updated_at = NOW()
  RETURNING id INTO v_profile_id;
  
  -- Step 2: Create role-specific record
  IF p_role = 'patient' THEN
    -- Create or update patient record
    INSERT INTO patients (
      user_id, profile_id, full_name, email, phone, date_of_birth,
      emergency_contact_name, emergency_contact_phone, 
      medical_history, allergies, current_medications
    ) VALUES (
      p_user_id, v_profile_id, p_full_name, p_email, p_phone, p_date_of_birth,
      p_emergency_contact_name, p_emergency_contact_phone,
      p_medical_history, p_allergies, p_current_medications
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      profile_id = EXCLUDED.profile_id,
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      date_of_birth = EXCLUDED.date_of_birth,
      emergency_contact_name = EXCLUDED.emergency_contact_name,
      emergency_contact_phone = EXCLUDED.emergency_contact_phone,
      medical_history = EXCLUDED.medical_history,
      allergies = EXCLUDED.allergies,
      current_medications = EXCLUDED.current_medications,
      updated_at = NOW();
      
  ELSIF p_role = 'doctor' THEN
    -- Validate required doctor fields
    IF p_specialization IS NULL OR p_specialization = '' THEN
      RAISE EXCEPTION 'Specialization is required for doctors';
    END IF;
    
    -- Create or update doctor record
    INSERT INTO doctors (
      user_id, profile_id, name, email, phone, specialization, is_active
    ) VALUES (
      p_user_id, v_profile_id, p_full_name, p_email, p_phone, p_specialization, true
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      profile_id = EXCLUDED.profile_id,
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      specialization = EXCLUDED.specialization,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();
  ELSE
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;
  
  -- Return success result
  v_result := json_build_object(
    'success', true,
    'profile_id', v_profile_id,
    'role', p_role
  );
  
  RETURN v_result;
  
EXCEPTION
  -- If any error occurs, the transaction will automatically rollback
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Onboarding failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;