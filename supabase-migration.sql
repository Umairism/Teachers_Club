-- Teachers Club Database Schema
-- Execute this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'teacher', 'student');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'student',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    profile_picture_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Articles table
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50),
    tags TEXT[],
    is_published BOOLEAN DEFAULT true,
    featured_image_url TEXT,
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Confessions table
CREATE TABLE confessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_anonymous BOOLEAN DEFAULT false,
    is_moderated BOOLEAN DEFAULT false,
    moderator_id UUID REFERENCES users(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Article comments table
CREATE TABLE article_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES article_comments(id) ON DELETE CASCADE,
    likes INTEGER DEFAULT 0,
    is_moderated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Confession comments table
CREATE TABLE confession_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    confession_id UUID REFERENCES confessions(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES confession_comments(id) ON DELETE CASCADE,
    likes INTEGER DEFAULT 0,
    is_moderated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table (for tracking who liked what)
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL, -- 'article', 'confession', 'article_comment', 'confession_comment'
    target_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id)
);

-- Create indexes for better performance
CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX idx_confessions_author_id ON confessions(author_id);
CREATE INDEX idx_confessions_created_at ON confessions(created_at DESC);
CREATE INDEX idx_article_comments_article_id ON article_comments(article_id);
CREATE INDEX idx_article_comments_parent_id ON article_comments(parent_id);
CREATE INDEX idx_confession_comments_confession_id ON confession_comments(confession_id);
CREATE INDEX idx_confession_comments_parent_id ON confession_comments(parent_id);
CREATE INDEX idx_likes_user_target ON likes(user_id, target_type, target_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE confession_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all users" ON users FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
);

-- Articles policies
CREATE POLICY "Anyone can view published articles" ON articles FOR SELECT USING (is_published = true);
CREATE POLICY "Authors can manage own articles" ON articles FOR ALL USING (auth.uid() = author_id);
CREATE POLICY "Teachers can create articles" ON articles FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'moderator', 'teacher')
    )
);
CREATE POLICY "Admins can manage all articles" ON articles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
);

-- Confessions policies
CREATE POLICY "Anyone can view moderated confessions" ON confessions FOR SELECT USING (is_moderated = true);
CREATE POLICY "Authors can view own confessions" ON confessions FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Anyone can create confessions" ON confessions FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own confessions" ON confessions FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own confessions" ON confessions FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Moderators can manage all confessions" ON confessions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
);

-- Article comments policies
CREATE POLICY "Anyone can view comments on published articles" ON article_comments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM articles 
        WHERE id = article_comments.article_id AND is_published = true
    )
);
CREATE POLICY "Authenticated users can create comments" ON article_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own comments" ON article_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own comments" ON article_comments FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Moderators can manage all comments" ON article_comments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
);

-- Confession comments policies
CREATE POLICY "Anyone can view comments on moderated confessions" ON confession_comments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM confessions 
        WHERE id = confession_comments.confession_id AND is_moderated = true
    )
);
CREATE POLICY "Authenticated users can create confession comments" ON confession_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own confession comments" ON confession_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own confession comments" ON confession_comments FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Moderators can manage all confession comments" ON confession_comments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
);

-- Likes policies
CREATE POLICY "Users can view all likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can manage own likes" ON likes FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_articles BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_confessions BEFORE UPDATE ON confessions FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_article_comments BEFORE UPDATE ON article_comments FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_confession_comments BEFORE UPDATE ON confession_comments FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Insert sample data
INSERT INTO users (id, email, name, role) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@teachersclub.com', 'Admin User', 'admin'),
    ('00000000-0000-0000-0000-000000000002', 'moderator@teachersclub.com', 'Moderator User', 'moderator'),
    ('00000000-0000-0000-0000-000000000003', 'teacher@teachersclub.com', 'Teacher User', 'teacher'),
    ('00000000-0000-0000-0000-000000000004', 'student@teachersclub.com', 'Student User', 'student');

-- Insert sample articles
INSERT INTO articles (id, title, content, author_id, category, tags) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Welcome to Teachers Club', 'This is your first article in the Teachers Club platform.', '00000000-0000-0000-0000-000000000003', 'General', ARRAY['welcome', 'introduction']),
    ('10000000-0000-0000-0000-000000000002', 'Teaching Best Practices', 'Here are some effective teaching methodologies.', '00000000-0000-0000-0000-000000000003', 'Education', ARRAY['teaching', 'methods']);

-- Insert sample confessions
INSERT INTO confessions (id, content, author_id, is_moderated) VALUES
    ('20000000-0000-0000-0000-000000000001', 'Sometimes I feel overwhelmed by the workload but I love teaching.', '00000000-0000-0000-0000-000000000003', true),
    ('20000000-0000-0000-0000-000000000002', 'I wish there were more resources for professional development.', '00000000-0000-0000-0000-000000000004', true);
