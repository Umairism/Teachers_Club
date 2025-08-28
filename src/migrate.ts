import { supabase } from './lib/supabase';
import { db } from './lib/database';

/**
 * Migration helper to transfer data from localStorage to Supabase
 * Run this once after setting up Supabase to migrate existing data
 */
export async function migrateToSupabase() {
  console.log('🚀 Starting migration to Supabase...');

  try {
    // Get all data from localStorage
    const users = await db.getUsers();
    const articles = await db.getArticles();
    const confessions = await db.getConfessions();

    console.log(`📊 Found ${users.length} users, ${articles.length} articles, ${confessions.length} confessions`);

    // Migrate users
    for (const user of users) {
      const { error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          is_active: user.isActive,
          profile_picture_url: user.profilePicture,
          bio: user.bio,
          created_at: user.createdAt,
          updated_at: user.updatedAt
        });

      if (error && !error.message.includes('already exists')) {
        console.error('Error migrating user:', user.email, error);
      }
    }

    // Migrate articles
    for (const article of articles) {
      const { error } = await supabase
        .from('articles')
        .insert({
          id: article.id,
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          category: article.category,
          author_id: article.authorId,
          status: article.status || 'published',
          is_featured: article.isFeatured,
          is_moderated: article.isModerated,
          image_url: article.imageUrl,
          tags: article.tags,
          likes: article.likes,
          views: article.views,
          created_at: article.createdAt,
          updated_at: article.updatedAt
        });

      if (error && !error.message.includes('already exists')) {
        console.error('Error migrating article:', article.title, error);
      }
    }

    // Migrate confessions
    for (const confession of confessions) {
      const { error } = await supabase
        .from('confessions')
        .insert({
          id: confession.id,
          author_id: confession.authorId,
          content: confession.content,
          category: confession.category || 'general',
          is_anonymous: confession.isAnonymous,
          likes: confession.likes,
          tags: confession.tags,
          is_moderated: confession.isModerated,
          created_at: confession.createdAt,
          updated_at: confession.updatedAt
        });

      if (error && !error.message.includes('already exists')) {
        console.error('Error migrating confession:', confession.id, error);
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('🔄 You can now switch to using Supabase by updating your imports');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Uncomment the line below and run this file to perform migration
// migrateToSupabase();
