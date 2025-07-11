-- Migration: User Groups and Role-Based Access Control
-- Run date: 2025-01-11

-- Create user groups table
CREATE TABLE IF NOT EXISTS user_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_group_memberships table to link users to groups
CREATE TABLE IF NOT EXISTS user_group_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, group_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_group_memberships_user_id ON user_group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_group_memberships_group_id ON user_group_memberships(group_id);

-- Insert default user groups
INSERT INTO user_groups (name, description, permissions) VALUES 
(
    'admin', 
    'System administrators with full access',
    '{
        "can_manage_users": true,
        "can_manage_doctors": true,
        "can_manage_appointments": true,
        "can_view_all_data": true,
        "can_manage_system_settings": true,
        "can_access_admin_panel": true
    }'
),
(
    'patient', 
    'Patients who can book appointments and manage their health records',
    '{
        "can_book_appointments": true,
        "can_view_own_appointments": true,
        "can_manage_own_profile": true,
        "can_view_own_medical_records": true,
        "can_chat_with_doctors": true
    }'
),
(
    'doctor', 
    'Medical professionals who can manage patients and appointments',
    '{
        "can_view_assigned_appointments": true,
        "can_manage_patient_records": true,
        "can_manage_own_schedule": true,
        "can_chat_with_patients": true,
        "can_prescribe_medications": true,
        "can_view_patient_history": true
    }'
)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = CURRENT_TIMESTAMP;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    user_permissions JSONB := '{}';
    group_permissions JSONB;
BEGIN
    -- Get all permissions from user's groups
    FOR group_permissions IN
        SELECT ug.permissions
        FROM user_groups ug
        JOIN user_group_memberships ugm ON ug.id = ugm.group_id
        WHERE ugm.user_id = user_uuid
    LOOP
        -- Merge permissions (OR operation for boolean values)
        user_permissions := user_permissions || group_permissions;
    END LOOP;
    
    RETURN user_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        (get_user_permissions(user_uuid) ->> permission_name)::BOOLEAN,
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign user to group
CREATE OR REPLACE FUNCTION assign_user_to_group(
    target_user_id UUID,
    group_name TEXT,
    assigning_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    target_group_id UUID;
BEGIN
    -- Get group ID
    SELECT id INTO target_group_id
    FROM user_groups
    WHERE name = group_name;
    
    IF target_group_id IS NULL THEN
        RAISE EXCEPTION 'Group % does not exist', group_name;
    END IF;
    
    -- Insert membership
    INSERT INTO user_group_memberships (user_id, group_id, assigned_by)
    VALUES (target_user_id, target_group_id, assigning_user_id)
    ON CONFLICT (user_id, group_id) DO NOTHING;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove user from group
CREATE OR REPLACE FUNCTION remove_user_from_group(
    target_user_id UUID,
    group_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    target_group_id UUID;
BEGIN
    -- Get group ID
    SELECT id INTO target_group_id
    FROM user_groups
    WHERE name = group_name;
    
    IF target_group_id IS NULL THEN
        RAISE EXCEPTION 'Group % does not exist', group_name;
    END IF;
    
    -- Remove membership
    DELETE FROM user_group_memberships
    WHERE user_id = target_user_id AND group_id = target_group_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user groups
CREATE OR REPLACE FUNCTION get_user_groups(user_uuid UUID)
RETURNS TABLE (
    group_id UUID,
    group_name TEXT,
    group_description TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ug.id,
        ug.name,
        ug.description,
        ugm.assigned_at
    FROM user_groups ug
    JOIN user_group_memberships ugm ON ug.id = ugm.group_id
    WHERE ugm.user_id = user_uuid
    ORDER BY ugm.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing users to have appropriate groups based on their current roles
-- First, assign all existing patients to patient group
INSERT INTO user_group_memberships (user_id, group_id)
SELECT 
    p.user_id,
    (SELECT id FROM user_groups WHERE name = 'patient')
FROM patients p
WHERE p.user_id IS NOT NULL
ON CONFLICT (user_id, group_id) DO NOTHING;

-- Assign all existing doctors to doctor group
INSERT INTO user_group_memberships (user_id, group_id)
SELECT 
    d.user_id,
    (SELECT id FROM user_groups WHERE name = 'doctor')
FROM doctors d
WHERE d.user_id IS NOT NULL
ON CONFLICT (user_id, group_id) DO NOTHING;

-- Add role column to auth metadata (for quick role checks)
CREATE OR REPLACE FUNCTION update_user_role_metadata()
RETURNS TRIGGER AS $$
DECLARE
    user_roles TEXT[];
BEGIN
    -- Get all group names for the user
    SELECT array_agg(ug.name) INTO user_roles
    FROM user_groups ug
    JOIN user_group_memberships ugm ON ug.id = ugm.group_id
    WHERE ugm.user_id = COALESCE(NEW.user_id, OLD.user_id);
    
    -- Update user metadata in auth.users
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}') || 
        jsonb_build_object('roles', user_roles)
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update user metadata when group membership changes
DROP TRIGGER IF EXISTS trigger_update_user_role_metadata ON user_group_memberships;
CREATE TRIGGER trigger_update_user_role_metadata
    AFTER INSERT OR UPDATE OR DELETE ON user_group_memberships
    FOR EACH ROW EXECUTE FUNCTION update_user_role_metadata();

-- RLS Policies for security
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_group_memberships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all groups
CREATE POLICY "Users can view all groups" ON user_groups
    FOR SELECT TO authenticated
    USING (true);

-- Policy: Only admins can modify groups
CREATE POLICY "Only admins can modify groups" ON user_groups
    FOR ALL TO authenticated
    USING (user_has_permission(auth.uid(), 'can_manage_system_settings'));

-- Policy: Users can view their own group memberships
CREATE POLICY "Users can view own group memberships" ON user_group_memberships
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Policy: Admins can view all group memberships
CREATE POLICY "Admins can view all group memberships" ON user_group_memberships
    FOR SELECT TO authenticated
    USING (user_has_permission(auth.uid(), 'can_manage_users'));

-- Policy: Only admins can modify group memberships
CREATE POLICY "Only admins can modify group memberships" ON user_group_memberships
    FOR ALL TO authenticated
    USING (user_has_permission(auth.uid(), 'can_manage_users'));

-- Create the first admin user (you'll need to update this with actual user ID)
-- This is just a placeholder - you should run this manually with the correct user ID
-- INSERT INTO user_group_memberships (user_id, group_id)
-- VALUES (
--     'YOUR_ADMIN_USER_ID_HERE',
--     (SELECT id FROM user_groups WHERE name = 'admin')
-- );

COMMENT ON TABLE user_groups IS 'Defines different user roles and their permissions';
COMMENT ON TABLE user_group_memberships IS 'Links users to their assigned groups/roles';
COMMENT ON FUNCTION get_user_permissions(UUID) IS 'Returns combined permissions for a user from all their groups';
COMMENT ON FUNCTION user_has_permission(UUID, TEXT) IS 'Checks if user has a specific permission';
COMMENT ON FUNCTION assign_user_to_group(UUID, TEXT, UUID) IS 'Assigns a user to a group';
COMMENT ON FUNCTION remove_user_from_group(UUID, TEXT) IS 'Removes a user from a group';
COMMENT ON FUNCTION get_user_groups(UUID) IS 'Returns all groups a user belongs to';