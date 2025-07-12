-- Migration: Fix patients table constraints for user registration
-- Run date: 2025-01-11

-- Add unique constraint on user_id for patients table
ALTER TABLE patients ADD CONSTRAINT patients_user_id_unique UNIQUE (user_id);

-- Add unique constraint on profile_id for patients table  
ALTER TABLE patients ADD CONSTRAINT patients_profile_id_unique UNIQUE (profile_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_profile_id ON patients(profile_id) WHERE profile_id IS NOT NULL;