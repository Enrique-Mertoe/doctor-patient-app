-- Migration: Add sample doctors for testing
-- Run date: 2025-01-11

-- Insert sample doctors if they don't exist
INSERT INTO doctors (name, specialization, email, phone, is_active) VALUES
('Dr. Sarah Johnson', 'Cardiology', 'sarah.johnson@medcare.com', '+1-555-0101', true),
('Dr. Michael Chen', 'Dermatology', 'michael.chen@medcare.com', '+1-555-0102', true),
('Dr. Emily Rodriguez', 'Pediatrics', 'emily.rodriguez@medcare.com', '+1-555-0103', true),
('Dr. David Kim', 'Orthopedics', 'david.kim@medcare.com', '+1-555-0104', true),
('Dr. Lisa Thompson', 'General Medicine', 'lisa.thompson@medcare.com', '+1-555-0105', true)
ON CONFLICT (email) DO NOTHING;

-- Update existing doctors to be active if they exist
UPDATE doctors SET is_active = true WHERE is_active IS NULL OR is_active = false;