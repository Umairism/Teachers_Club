import { supabase } from './supabase';
import type { User, Article, Confession, Comment, ConfessionComment } from '../types';

export class SupabaseDatabaseService {
  // User Management
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: userData.email,
        name: userData.name,
        role: userData.role,
        is_active: userData.isActive,
        profile_picture_url: userData.profilePictureUrl,
        bio: userData.bio
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      isActive: data.is_active,
      lastLogin: data.last_login,
      profilePictureUrl: data.profile_picture_url,
      bio: data.bio,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  // Article Management
  async getArticles(): Promise<Article[]> {
    const { data: articlesData, error: articlesError } = await supabase
      .from('articles')
      .select(`
        *,
        author:users(*)
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    
    if (articlesError) throw articlesError;

    const articles: Article[] = [];

    for (const article of articlesData || []) {
      // Get comments for this article
      const { data: commentsData, error: commentsError } = await supabase
        .from('article_comments')
        .select(`
          *,
          author:users(*),
          replies:article_comments(*, author:users(*))
        `)
        .eq('article_id', article.id)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      const comments: Comment[] = (commentsData || []).map(comment => ({
        id: comment.id,
        content: comment.content,
        authorId: comment.author_id,
        authorName: comment.author.name,
        authorRole: comment.author.role,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        likes: comment.likes,
        isModerated: comment.is_moderated,
        replies: (comment.replies || []).map((reply: any) => ({
          id: reply.id,
          content: reply.content,
          authorId: reply.author_id,
          authorName: reply.author.name,
          authorRole: reply.author.role,
          createdAt: reply.created_at,
          updatedAt: reply.updated_at,
          likes: reply.likes,
          isModerated: reply.is_moderated,
          replies: []
        }))
      }));

      articles.push({
        id: article.id,
        title: article.title,
        content: article.content,
        authorId: article.author_id,
        authorName: article.author.name,
        authorRole: article.author.role,
        category: article.category,
        tags: article.tags || [],
        isPublished: article.is_published,
        featuredImageUrl: article.featured_image_url,
        likes: article.likes,
        views: article.views,
        createdAt: article.created_at,
        updatedAt: article.updated_at,
        comments
      });
    }

    return articles;
  }

  async getArticleById(id: string): Promise<Article | null> {
    const articles = await this.getArticles();
    return articles.find(article => article.id === id) || null;
  }

  async createArticle(articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'views' | 'comments' | 'authorName' | 'authorRole'>): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .insert([{
        title: articleData.title,
        content: articleData.content,
        author_id: articleData.authorId,
        category: articleData.category,
        tags: articleData.tags,
        is_published: articleData.isPublished,
        featured_image_url: articleData.featuredImageUrl
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const article = await this.getArticleById(data.id);
    if (!article) throw new Error('Failed to retrieve created article');
    return article;
  }

  // Confession Management
  async getConfessions(): Promise<Confession[]> {
    const { data: confessionsData, error: confessionsError } = await supabase
      .from('confessions')
      .select(`
        *,
        author:users(*)
      `)
      .eq('is_moderated', true)
      .order('created_at', { ascending: false });
    
    if (confessionsError) throw confessionsError;

    const confessions: Confession[] = [];

    for (const confession of confessionsData || []) {
      // Get comments for this confession
      const { data: commentsData, error: commentsError } = await supabase
        .from('confession_comments')
        .select(`
          *,
          author:users(*),
          replies:confession_comments(*, author:users(*))
        `)
        .eq('confession_id', confession.id)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      const comments: ConfessionComment[] = (commentsData || []).map(comment => ({
        id: comment.id,
        content: comment.content,
        authorId: comment.author_id,
        authorName: comment.author.name,
        authorRole: comment.author.role,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        likes: comment.likes,
        isModerated: comment.is_moderated,
        replies: (comment.replies || []).map((reply: any) => ({
          id: reply.id,
          content: reply.content,
          authorId: reply.author_id,
          authorName: reply.author.name,
          authorRole: reply.author.role,
          createdAt: reply.created_at,
          updatedAt: reply.updated_at,
          likes: reply.likes,
          isModerated: reply.is_moderated,
          replies: []
        }))
      }));

      confessions.push({
        id: confession.id,
        content: confession.content,
        authorId: confession.author_id,
        authorName: confession.is_anonymous ? 'Anonymous' : confession.author.name,
        authorRole: confession.author.role,
        isAnonymous: confession.is_anonymous,
        isModerated: confession.is_moderated,
        moderatorId: confession.moderator_id,
        moderatedAt: confession.moderated_at,
        likes: confession.likes,
        createdAt: confession.created_at,
        updatedAt: confession.updated_at,
        comments
      });
    }

    return confessions;
  }

  async createConfession(confessionData: Omit<Confession, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'comments' | 'authorName' | 'authorRole'>): Promise<Confession> {
    const { data, error } = await supabase
      .from('confessions')
      .insert([{
        content: confessionData.content,
        author_id: confessionData.authorId,
        is_anonymous: confessionData.isAnonymous,
        is_moderated: confessionData.isModerated,
        moderator_id: confessionData.moderatorId,
        moderated_at: confessionData.moderatedAt
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const confessions = await this.getConfessions();
    const confession = confessions.find(c => c.id === data.id);
    if (!confession) throw new Error('Failed to retrieve created confession');
    return confession;
  }

  // Comment Management for Articles
  async addComment(articleId: string, commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'isModerated' | 'replies' | 'authorName' | 'authorRole'>): Promise<Comment> {
    const { data, error } = await supabase
      .from('article_comments')
      .insert([{
        article_id: articleId,
        author_id: commentData.authorId,
        content: commentData.content,
        parent_id: commentData.parentId || null
      }])
      .select(`
        *,
        author:users(*)
      `)
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      content: data.content,
      authorId: data.author_id,
      authorName: data.author.name,
      authorRole: data.author.role,
      parentId: data.parent_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      likes: data.likes,
      isModerated: data.is_moderated,
      replies: []
    };
  }

  async deleteComment(articleId: string, commentId: string, userId: string, isAdmin = false): Promise<boolean> {
    // First check if user owns the comment or is admin
    const { data: comment, error: fetchError } = await supabase
      .from('article_comments')
      .select('author_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      console.error('Comment not found:', commentId);
      return false;
    }

    if (comment.author_id !== userId && !isAdmin) {
      console.error('Permission denied: user cannot delete this comment');
      return false;
    }

    // Delete the comment (this will cascade to replies due to foreign key constraint)
    const { error } = await supabase
      .from('article_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return false;
    }

    return true;
  }

  async likeComment(articleId: string, commentId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('article_comments')
      .update({ likes: supabase.raw('likes + 1') })
      .eq('id', commentId);

    if (error) {
      console.error('Error liking comment:', error);
      return false;
    }

    // Also track the like
    await supabase
      .from('likes')
      .insert([{
        user_id: userId,
        target_type: 'article_comment',
        target_id: commentId
      }]);

    return true;
  }

  // Comment Management for Confessions
  async addConfessionComment(confessionId: string, commentData: Omit<ConfessionComment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'isModerated' | 'replies' | 'authorName' | 'authorRole'>): Promise<ConfessionComment> {
    const { data, error } = await supabase
      .from('confession_comments')
      .insert([{
        confession_id: confessionId,
        author_id: commentData.authorId,
        content: commentData.content,
        parent_id: commentData.parentId || null
      }])
      .select(`
        *,
        author:users(*)
      `)
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      content: data.content,
      authorId: data.author_id,
      authorName: data.author.name,
      authorRole: data.author.role,
      parentId: data.parent_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      likes: data.likes,
      isModerated: data.is_moderated,
      replies: []
    };
  }

  async deleteConfessionComment(confessionId: string, commentId: string, userId: string, isAdmin = false): Promise<boolean> {
    // First check if user owns the comment or is admin
    const { data: comment, error: fetchError } = await supabase
      .from('confession_comments')
      .select('author_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      console.error('Confession comment not found:', commentId);
      return false;
    }

    if (comment.author_id !== userId && !isAdmin) {
      console.error('Permission denied: user cannot delete this confession comment');
      return false;
    }

    // Delete the comment (this will cascade to replies due to foreign key constraint)
    const { error } = await supabase
      .from('confession_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting confession comment:', error);
      return false;
    }

    return true;
  }

  async likeConfessionComment(confessionId: string, commentId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('confession_comments')
      .update({ likes: supabase.raw('likes + 1') })
      .eq('id', commentId);

    if (error) {
      console.error('Error liking confession comment:', error);
      return false;
    }

    // Also track the like
    await supabase
      .from('likes')
      .insert([{
        user_id: userId,
        target_type: 'confession_comment',
        target_id: commentId
      }]);

    return true;
  }

  // Like Management for Articles and Confessions
  async likeArticle(articleId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('articles')
      .update({ likes: supabase.raw('likes + 1') })
      .eq('id', articleId);

    if (error) {
      console.error('Error liking article:', error);
      return false;
    }

    // Track the like
    await supabase
      .from('likes')
      .insert([{
        user_id: userId,
        target_type: 'article',
        target_id: articleId
      }]);

    return true;
  }

  async likeConfession(confessionId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('confessions')
      .update({ likes: supabase.raw('likes + 1') })
      .eq('id', confessionId);

    if (error) {
      console.error('Error liking confession:', error);
      return false;
    }

    // Track the like
    await supabase
      .from('likes')
      .insert([{
        user_id: userId,
        target_type: 'confession',
        target_id: confessionId
      }]);

    return true;
  }
}

export const supabaseDb = new SupabaseDatabaseService();
