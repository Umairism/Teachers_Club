-- Enable the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_role enum with all four roles
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'teacher', 'student');

-- Create article status enum
CREATE TYPE article_status AS ENUM ('draft', 'under_review', 'published', 'archived');

-- Create confession category enum  
CREATE TYPE confession_category AS ENUM ('general', 'academic', 'personal', 'other');

-- Create users table with enhanced permissions
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'student',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    profile_picture_url VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create articles table with enhanced features
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category VARCHAR(100) NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status article_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    is_moderated BOOLEAN DEFAULT false,
    image_url VARCHAR(500),
    tags TEXT[] DEFAULT '{}',
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table with enhanced user info
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    is_moderated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create confessions table with enhanced features
CREATE TABLE IF NOT EXISTS confessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category confession_category DEFAULT 'general',
    is_anonymous BOOLEAN DEFAULT true,
    likes INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    is_moderated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table for content moderation
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_content_type VARCHAR(50) NOT NULL, -- 'article', 'confession', 'comment'
    reported_content_id UUID NOT NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin logs table for audit trail
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50), -- 'user', 'article', 'confession', 'comment'
    target_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_is_featured ON articles(is_featured);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_likes ON articles(likes DESC);
CREATE INDEX IF NOT EXISTS idx_articles_views ON articles(views DESC);

CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_confessions_author_id ON confessions(author_id);
CREATE INDEX IF NOT EXISTS idx_confessions_category ON confessions(category);
CREATE INDEX IF NOT EXISTS idx_confessions_created_at ON confessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_is_anonymous ON confessions(is_anonymous);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_content_type ON reports(reported_content_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_confessions_updated_at BEFORE UPDATE ON confessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default users with different roles
INSERT INTO users (email, name, role) 
VALUES 
    ('admin@teachersclub.com', 'System Administrator', 'admin'),
    ('moderator@teachersclub.com', 'Content Moderator', 'moderator'),
    ('teacher@teachersclub.com', 'Sample Teacher', 'teacher'),
    ('student@teachersclub.com', 'Sample Student', 'student')
ON CONFLICT (email) DO NOTHING;

-- Sample data for demonstration
DO $$
DECLARE
    admin_user_id UUID;
    teacher_user_id UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@teachersclub.com';
    SELECT id INTO teacher_user_id FROM users WHERE email = 'teacher@teachersclub.com';
    
    -- Insert sample articles if they don't exist
    INSERT INTO articles (title, content, excerpt, category, author_id, status, is_featured, tags, likes, views)
    VALUES 
        (
            'Welcome to Teachers Club',
            'Welcome to our comprehensive teachers community platform. This system is designed to facilitate communication, knowledge sharing, and collaboration among educators, administrators, and students.',
            'Introduction to the Teachers Club platform and its features.',
            'Announcements',
            admin_user_id,
            'published',
            true,
            ARRAY['welcome', 'introduction', 'platform'],
            15,
            120
        ),
        (
            'Best Practices in Modern Education',
            'As educators, we continuously evolve our teaching methodologies to meet the changing needs of our students. This article explores innovative approaches to engage students and enhance learning outcomes.',
            'Exploring innovative teaching methodologies for better student engagement.',
            'Education',
            teacher_user_id,
            'published',
            true,
            ARRAY['teaching', 'education', 'best-practices'],
            25,
            200
        ),
        (
            'Community Guidelines for Teachers',
            'Our community thrives on mutual respect, professional conduct, and collaborative spirit. Please review these guidelines to ensure a positive experience for all members.',
            'Important guidelines for maintaining a professional and respectful community.',
            'Guidelines',
            admin_user_id,
            'published',
            false,
            ARRAY['guidelines', 'community', 'policies'],
            8,
            85
        )
    ON CONFLICT DO NOTHING;
    
    -- Insert sample confessions
    INSERT INTO confessions (author_id, content, category, is_anonymous, likes)
    VALUES 
        (
            teacher_user_id,
            'Sometimes I feel overwhelmed by the amount of grading I have to do, especially during exam periods. Finding the right work-life balance as an educator can be challenging.',
            'personal',
            true,
            12
        ),
        (
            teacher_user_id,
            'I''ve noticed that interactive teaching methods work much better than traditional lectures. Students seem more engaged when they can participate actively in discussions.',
            'academic',
            false,
            18
        )
    ON CONFLICT DO NOTHING;
END $$;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view all active users" ON users
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role = 'admin'
        )
    );

-- Create RLS policies for articles table
CREATE POLICY "Everyone can view published articles" ON articles
    FOR SELECT USING (status = 'published');

CREATE POLICY "Teachers and admins can create articles" ON articles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "Authors can update their own articles" ON articles
    FOR UPDATE USING (author_id::text = auth.uid()::text);

CREATE POLICY "Admins and moderators can update any article" ON articles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admins and moderators can delete any article" ON articles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role IN ('admin', 'moderator')
        )
    );

-- Create RLS policies for confessions table
CREATE POLICY "Everyone can view confessions" ON confessions
    FOR SELECT USING (true);

CREATE POLICY "Teachers and admins can create confessions" ON confessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "Authors can update their own confessions" ON confessions
    FOR UPDATE USING (author_id::text = auth.uid()::text);

CREATE POLICY "Admins and moderators can delete any confession" ON confessions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role IN ('admin', 'moderator')
        )
    );

-- Create RLS policies for comments table
CREATE POLICY "Everyone can view comments" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update their own comments" ON comments
    FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins and moderators can delete any comment" ON comments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role IN ('admin', 'moderator')
        )
    );

-- Create RLS policies for reports table
CREATE POLICY "Users can view their own reports" ON reports
    FOR SELECT USING (reporter_id::text = auth.uid()::text);

CREATE POLICY "Admins and moderators can view all reports" ON reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Authenticated users can create reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for admin logs table
CREATE POLICY "Only admins can view admin logs" ON admin_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role = 'admin'
        )
    );

CREATE POLICY "Only admins can create admin logs" ON admin_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id::text = auth.uid()::text 
            AND u.role = 'admin'
        )
    );
