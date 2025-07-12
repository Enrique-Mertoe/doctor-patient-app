-- Migration: Add missing doctor fields
-- Run date: 2025-01-11

-- Add missing columns to doctors table
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS license_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS years_experience INTEGER,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctors_license_number ON doctors(license_number);
CREATE INDEX IF NOT EXISTS idx_doctors_created_by ON doctors(created_by);
CREATE INDEX IF NOT EXISTS idx_doctors_years_experience ON doctors(years_experience);

-- Update RLS policies for the new created_by field
-- Add policy to allow users to see doctors they created
CREATE POLICY "Users can view doctors they created" ON doctors
    FOR SELECT TO authenticated
    USING (created_by = auth.uid());

COMMENT ON COLUMN doctors.bio IS 'Doctor biography and professional background';
COMMENT ON COLUMN doctors.license_number IS 'Medical license number';
COMMENT ON COLUMN doctors.years_experience IS 'Years of medical practice experience';
COMMENT ON COLUMN doctors.created_by IS 'User ID of the admin who created this doctor record';