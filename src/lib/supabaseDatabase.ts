import { supabase, type Tables, type TablesInsert, type TablesUpdate } from './supabase';
import { User, Article, Confession, Comment, Report, AdminLog } from '../types';

class SupabaseDatabaseService {
  // User operations
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return this.mapSupabaseUsersToLocal(data || []);
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return this.mapSupabaseUserToLocal(data);
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: userData.email,
        name: userData.name,
        role: userData.role,
        is_active: userData.isActive ?? true,
        profile_picture_url: userData.profilePicture,
        bio: userData.bio
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapSupabaseUserToLocal(data);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        name: updates.name,
        role: updates.role,
        is_active: updates.isActive,
        profile_picture_url: updates.profilePicture,
        bio: updates.bio,
        last_login: updates.lastLogin
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapSupabaseUserToLocal(data);
  }

  async deleteUser(id: string, adminId: string): Promise<boolean> {
    // Log the deletion
    await this.logAdminAction(adminId, 'delete_user', 'user', id, { deletedUserId: id });

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    return !error;
  }

  // Article operations
  async getArticles(): Promise<Article[]> {
    const { data, error } = await supabase
      .from('articles')
      .select(`
        *,
        author:users(id, name, role),
        comments(id, content, user_id, created_at)
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return this.mapSupabaseArticlesToLocal(data || []);
  }

  async createArticle(articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'views' | 'comments'>): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .insert({
        title: articleData.title,
        content: articleData.content,
        excerpt: articleData.excerpt,
        category: articleData.category,
        author_id: articleData.authorId,
        status: articleData.status || 'published',
        is_featured: articleData.isFeatured || false,
        image_url: articleData.imageUrl,
        tags: articleData.tags || []
      })
      .select(`
        *,
        author:users(id, name, role)
      `)
      .single();

    if (error) throw error;
    return this.mapSupabaseArticleToLocal(data);
  }

  async updateArticle(id: string, updates: Partial<Article>): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .update({
        title: updates.title,
        content: updates.content,
        excerpt: updates.excerpt,
        category: updates.category,
        status: updates.status,
        is_featured: updates.isFeatured,
        image_url: updates.imageUrl,
        tags: updates.tags,
        likes: updates.likes,
        views: updates.views
      })
      .eq('id', id)
      .select(`
        *,
        author:users(id, name, role),
        comments(id, content, user_id, created_at)
      `)
      .single();

    if (error) throw error;
    return this.mapSupabaseArticleToLocal(data);
  }

  async deleteArticle(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    return !error;
  }

  // Confession operations
  async getConfessions(): Promise<Confession[]> {
    const { data, error } = await supabase
      .from('confessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return this.mapSupabaseConfessionsToLocal(data || []);
  }

  async createConfession(confessionData: Omit<Confession, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'reports'>): Promise<Confession> {
    const { data, error } = await supabase
      .from('confessions')
      .insert({
        author_id: confessionData.authorId,
        content: confessionData.content,
        category: confessionData.category || 'general',
        is_anonymous: confessionData.isAnonymous ?? true,
        tags: confessionData.tags || []
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapSupabaseConfessionToLocal(data);
  }

  async deleteConfession(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('confessions')
      .delete()
      .eq('id', id);

    return !error;
  }

  // Statistics
  async getStats() {
    const [usersResult, articlesResult, confessionsResult] = await Promise.all([
      supabase.from('users').select('id, created_at').eq('is_active', true),
      supabase.from('articles').select('id, created_at, likes, views').eq('status', 'published'),
      supabase.from('confessions').select('id, created_at, likes')
    ]);

    if (usersResult.error || articlesResult.error || confessionsResult.error) {
      throw new Error('Failed to fetch statistics');
    }

    const users = usersResult.data || [];
    const articles = articlesResult.data || [];
    const confessions = confessionsResult.data || [];

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentArticles = articles.filter(a => new Date(a.created_at) > weekAgo);
    const recentConfessions = confessions.filter(c => new Date(c.created_at) > weekAgo);
    const recentUsers = users.filter(u => new Date(u.created_at) > weekAgo);

    return {
      totalArticles: articles.length,
      totalConfessions: confessions.length,
      totalUsers: users.length,
      totalLikes: articles.reduce((sum, a) => sum + (a.likes || 0), 0) + confessions.reduce((sum, c) => sum + (c.likes || 0), 0),
      totalComments: 0, // Would need to implement comment counting
      totalViews: articles.reduce((sum, a) => sum + (a.views || 0), 0),
      weeklyGrowth: {
        articles: recentArticles.length,
        confessions: recentConfessions.length,
        users: recentUsers.length,
        engagement: recentArticles.reduce((sum, a) => sum + (a.likes || 0), 0) + recentConfessions.reduce((sum, c) => sum + (c.likes || 0), 0)
      }
    };
  }

  // Admin logging
  async logAdminAction(adminId: string, action: string, targetType?: string, targetId?: string, details?: any): Promise<void> {
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: adminId,
        action,
        target_type: targetType,
        target_id: targetId,
        details
      });
  }

  // Mapping functions to convert Supabase data to local types
  private mapSupabaseUserToLocal(user: any): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.is_active,
      lastLogin: user.last_login,
      profilePicture: user.profile_picture_url,
      bio: user.bio,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }

  private mapSupabaseUsersToLocal(users: any[]): User[] {
    return users.map(user => this.mapSupabaseUserToLocal(user));
  }

  private mapSupabaseArticleToLocal(article: any): Article {
    return {
      id: article.id,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      category: article.category,
      authorId: article.author_id,
      author: article.author ? {
        id: article.author.id,
        name: article.author.name,
        role: article.author.role
      } : { id: article.author_id, name: 'Unknown', role: 'student' },
      status: article.status,
      isFeatured: article.is_featured,
      isModerated: article.is_moderated,
      imageUrl: article.image_url,
      tags: article.tags || [],
      likes: article.likes || 0,
      views: article.views || 0,
      comments: article.comments ? article.comments.map((c: any) => ({
        id: c.id,
        content: c.content,
        userId: c.user_id,
        createdAt: c.created_at
      })) : [],
      createdAt: article.created_at,
      updatedAt: article.updated_at
    };
  }

  private mapSupabaseArticlesToLocal(articles: any[]): Article[] {
    return articles.map(article => this.mapSupabaseArticleToLocal(article));
  }

  private mapSupabaseConfessionToLocal(confession: any): Confession {
    return {
      id: confession.id,
      authorId: confession.author_id,
      content: confession.content,
      category: confession.category,
      isAnonymous: confession.is_anonymous,
      likes: confession.likes || 0,
      tags: confession.tags || [],
      isModerated: confession.is_moderated,
      reports: [], // Would need to implement reports fetching
      createdAt: confession.created_at,
      updatedAt: confession.updated_at
    };
  }

  private mapSupabaseConfessionsToLocal(confessions: any[]): Confession[] {
    return confessions.map(confession => this.mapSupabaseConfessionToLocal(confession));
  }
}

export const supabaseDb = new SupabaseDatabaseService();
