# 🚀 Supabase Migration Guide

This guide will help you migrate your Teachers Club application from localStorage to Supabase for production deployment.

## 📋 Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Node.js & npm**: Already installed in your project
3. **Supabase CLI** (optional but recommended): `npm install -g supabase`

## 🛠️ Step-by-Step Migration

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project name: `teachers-club`
5. Enter database password (save this securely!)
6. Select region closest to your users
7. Click "Create new project"

### 2. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire content from `src/supabase/schema.sql`
3. Paste it into the SQL Editor
4. Click **Run** to execute the migration

This will create:
- ✅ All necessary tables (users, articles, confessions, comments, reports, admin_logs)
- ✅ Proper indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Sample data for testing
- ✅ Database triggers for auto-updating timestamps

### 3. Configure Environment Variables

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public key**
3. Create `.env.local` file in your project root:

```bash
# Copy from .env.example and fill in your values
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Enable Authentication (Optional)

If you want to use Supabase Auth instead of the current system:

1. Go to **Authentication** → **Settings**
2. Configure your site URL: `http://localhost:5173` (development)
3. Add production URL when deploying
4. Enable email/password authentication
5. Configure email templates if needed

### 5. Update Application Code

The migration service is already prepared in `src/lib/supabaseDatabase.ts`. To switch from localStorage to Supabase:

1. **Update database import** in your components:
```typescript
// Replace this:
import { db } from '../lib/database';

// With this:
import { supabaseDb as db } from '../lib/supabaseDatabase';
```

2. **Update authentication** (if using Supabase Auth):
```typescript
import { supabase } from '../lib/supabase';

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Register  
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});
```

### 6. Test the Migration

1. Start your development server:
```bash
npm run dev
```

2. Test key functionality:
   - ✅ User registration/login
   - ✅ Creating articles (teachers/admins)
   - ✅ Creating confessions (teachers/admins)  
   - ✅ Role-based permissions
   - ✅ Admin panel functionality
   - ✅ Live statistics

### 7. Production Deployment

#### Option A: Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

#### Option B: Netlify
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables

#### Option C: Manual Deployment
1. Build the project: `npm run build`
2. Upload `dist` folder to your hosting provider
3. Configure environment variables on your server

## 🔒 Security Considerations

### Row Level Security (RLS)
The schema includes comprehensive RLS policies:

- **Users**: Can view active users, update own profile, admins manage all
- **Articles**: Public read, role-based create/update/delete
- **Confessions**: Public read, teachers/admins create, moderators/admins delete
- **Comments**: Public read, authenticated create, role-based moderation
- **Reports**: Users see own, admins/moderators see all
- **Admin Logs**: Admin-only access

### Environment Variables
Never commit these to version control:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Database passwords

## 📊 Database Schema Overview

```
users                 # User accounts with roles
├── id (UUID)
├── email (unique)
├── name
├── role (admin|moderator|teacher|student)
├── is_active
└── timestamps

articles              # Blog posts/articles
├── id (UUID)
├── title, content, excerpt
├── author_id → users
├── status (draft|published|etc)
├── likes, views
└── timestamps

confessions          # Anonymous confessions
├── id (UUID)
├── author_id → users
├── content, category
├── is_anonymous
├── likes
└── timestamps

comments             # Article comments
├── id (UUID)
├── article_id → articles
├── user_id → users
├── content
└── timestamps

reports              # Content moderation
├── id (UUID)
├── reporter_id → users
├── reported_content_type/id
├── reason, status
└── timestamps

admin_logs           # Audit trail
├── id (UUID)
├── admin_id → users
├── action, target_type/id
├── details (JSON)
└── timestamps
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Error**: Check your `.env.local` file and Supabase URL/key
2. **RLS Errors**: Ensure you're authenticated and have proper permissions
3. **CORS Issues**: Add your domain to allowed origins in Supabase settings
4. **Build Errors**: Make sure all environment variables are set in your deployment platform

### Getting Help

1. Check [Supabase Documentation](https://supabase.com/docs)
2. Review [Supabase Discord](https://discord.supabase.com)
3. Check the browser console for detailed error messages

## 🎉 Post-Migration Checklist

- [ ] Database schema created successfully
- [ ] Environment variables configured
- [ ] Application connects to Supabase
- [ ] User registration/login works
- [ ] Role-based permissions function correctly
- [ ] Articles creation/management works
- [ ] Confessions system operational
- [ ] Admin panel accessible
- [ ] Live statistics updating
- [ ] Production deployment successful
- [ ] SSL certificate configured (production)
- [ ] Custom domain configured (optional)

## 📈 Next Steps

1. **Monitoring**: Set up Supabase monitoring and alerts
2. **Backups**: Configure automatic database backups
3. **Analytics**: Integrate with Google Analytics or similar
4. **Performance**: Monitor query performance and optimize
5. **Scaling**: Plan for growth with Supabase Pro features

---

**Congratulations!** 🎊 Your Teachers Club application is now running on Supabase with enterprise-grade security, scalability, and real-time features.
