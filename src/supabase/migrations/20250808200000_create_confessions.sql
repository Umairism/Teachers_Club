-- Create confessions table
CREATE TABLE IF NOT EXISTS confessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create RLS policies for confessions
ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own confessions
CREATE POLICY "Users can view their own confessions" 
  ON confessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only insert their own confessions
CREATE POLICY "Users can insert their own confessions" 
  ON confessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own confessions
CREATE POLICY "Users can delete their own confessions" 
  ON confessions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_confessions_user_id ON confessions(user_id);
CREATE INDEX idx_confessions_created_at ON confessions(created_at DESC);
