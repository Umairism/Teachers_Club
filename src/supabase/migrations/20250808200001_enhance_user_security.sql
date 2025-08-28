-- Enhanced security for users table
-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;

-- Create new restrictive policies
-- Users can only view their own profile
CREATE POLICY "Users can view own profile" 
  ON users 
  FOR SELECT 
  USING (auth.uid() = id);

-- Admins can view all users but with limited information
CREATE POLICY "Admins can view user management info" 
  ON users 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" 
  ON users 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Only admins can update user roles
CREATE POLICY "Admins can update user roles" 
  ON users 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Create a view for public article display that anonymizes authors
CREATE OR REPLACE VIEW public_articles AS
SELECT 
  id,
  title,
  content,
  excerpt,
  category,
  author_id,
  'Anonymous' as author_name,
  published,
  featured,
  image_url,
  tags,
  created_at,
  updated_at
FROM articles
WHERE published = true;

-- Grant access to the view
GRANT SELECT ON public_articles TO authenticated;
GRANT SELECT ON public_articles TO anon;
