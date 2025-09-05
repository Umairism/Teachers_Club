-- Fix infinite recursion in RLS policies
-- This migration fixes the circular dependency in user policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view user management info" ON users;
DROP POLICY IF EXISTS "Admins can update user roles" ON users;

-- Create a simpler policy structure that doesn't cause recursion
-- Users can view their own profile
-- (Keep the existing working policy as it doesn't cause recursion)

-- For admin functionality, we'll handle permissions in the application layer
-- rather than using complex RLS policies that reference the same table

-- Create a function to check if a user is admin (using auth.jwt())
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user has admin role in their JWT claims
  -- This avoids querying the users table from within the policy
  RETURN COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'role') = 'admin',
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative: Create a simpler admin policy that doesn't query users table
-- Only allow admins to view all users if they have admin role in JWT
CREATE POLICY "Admin users can view all profiles" 
  ON users 
  FOR SELECT 
  USING (is_admin());

-- Admin users can update any user profile
CREATE POLICY "Admin users can update all profiles" 
  ON users 
  FOR UPDATE 
  USING (is_admin());

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
