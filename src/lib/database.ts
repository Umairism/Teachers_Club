import { User, Article, Confession, Comment, Report, AdminLog, UserPermissions, ConfessionComment, Reaction, ReactionSummary, REACTION_TYPES } from '../types';
import { supabase } from './supabase';

// Helper function to get user permissions based on role
function getUserPermissions(role: User['role']): UserPermissions {
  const permissions: Record<User['role'], UserPermissions> = {
    admin: {
      canCreateArticles: true,
      canModerateContent: true,
      canManageUsers: true,
      canAccessAnalytics: true,
      canDeleteContent: true,
      canBanUsers: true,
    },
    moderator: {
      canCreateArticles: false,
      canModerateContent: true,
      canManageUsers: false,
      canAccessAnalytics: false,
      canDeleteContent: true,
      canBanUsers: false,
    },
    teacher: {
      canCreateArticles: true,
      canModerateContent: false,
      canManageUsers: false,
      canAccessAnalytics: false,
      canDeleteContent: false,
      canBanUsers: false,
    },
    student: {
      canCreateArticles: false,
      canModerateContent: false,
      canManageUsers: false,
      canAccessAnalytics: false,
      canDeleteContent: false,
      canBanUsers: false,
    },
  };
  return permissions[role];
}

export class DatabaseService {
  // Helper method to map Supabase user data to our User type
  private mapUserFromDB(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
      isActive: true, // Default to true since this column doesn't exist in schema
      lastLogin: dbUser.last_login,
      profilePicture: dbUser.profile_picture_url,
      bio: dbUser.bio || '',
      school: '', // Not in schema
      subject: '', // Not in schema  
      designation: '', // Not in schema
      permissions: getUserPermissions(dbUser.role)
    };
  }

  // Log admin actions to Supabase
  private async logAdminAction(adminId: string, action: string, targetType: 'user' | 'article' | 'confession' | 'comment', targetId: string, details: string): Promise<void> {
    try {
      await supabase.from('admin_logs').insert({
        admin_id: adminId,
        action,
        target_type: targetType,
        target_id: targetId,
        details,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  // Users
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'permissions' | 'isActive'>): Promise<User> {
    const now = new Date().toISOString();
    const insertData = {
      email: userData.email,
      name: userData.name,
      role: userData.role,
      profile_picture_url: userData.profilePicture,
      bio: userData.bio || '',
      created_at: now,
      updated_at: now
    };
    
    const { data, error } = await supabase.from('users').insert(insertData).select().single();
    
    if (error) {
      console.error('Database error during user creation:', error);
      throw error;
    }
    
    return this.mapUserFromDB(data);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      // This is expected for new users (404 error)
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error checking user existence:', error);
      return null;
    }
    
    return data ? this.mapUserFromDB(data) : null;
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return this.mapUserFromDB(data);
  }

  async getUsers(includeInactive = false): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*');
    if (error || !data) return [];
    return data.map(user => this.mapUserFromDB(user));
  }

  async updateUser(id: string, updates: Partial<User>, adminId?: string): Promise<User | null> {
    const now = new Date().toISOString();
    const updateData: any = {
      updated_at: now
    };
    
    if (updates.email) updateData.email = updates.email;
    if (updates.name) updateData.name = updates.name;
    if (updates.role) updateData.role = updates.role;
    if (updates.profilePicture) updateData.profile_picture_url = updates.profilePicture;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.lastLogin) updateData.last_login = updates.lastLogin;
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (adminId) {
      await this.logAdminAction(adminId, 'UPDATE_USER', 'user', id, `Updated user: ${JSON.stringify(updates)}`);
    }
    
    if (error || !data) return null;
    return this.mapUserFromDB(data);
  }

  async deleteUser(id: string, adminId: string): Promise<boolean> {
    // Since is_active column doesn't exist, we'll actually delete the user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    await this.logAdminAction(adminId, 'DELETE_USER', 'user', id, 'Deleted user');
    return !error;
  }

  // Articles
  async createArticle(articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'views' | 'comments' | 'isModerated'>): Promise<Article> {
    const now = new Date().toISOString();
    const { data, error } = await supabase.from('articles').insert({
      title: articleData.title,
      content: articleData.content,
      excerpt: articleData.excerpt,
      category: articleData.category,
      author_id: articleData.authorId,
      status: articleData.status || 'draft',
      is_featured: false,
      is_moderated: false,
      image_url: articleData.featuredImage,
      tags: articleData.tags || [],
      likes: 0,
      views: 0,
      created_at: now,
      updated_at: now
    }).select();
    if (error || !data || !data[0]) throw error || new Error('Failed to create article');
    return this.mapArticleFromDB(data[0]);
  }

  // Helper method to map Supabase article data to our Article type
  private mapArticleFromDB(dbArticle: any): Article {
    return {
      id: dbArticle.id,
      title: dbArticle.title,
      content: dbArticle.content,
      excerpt: dbArticle.excerpt,
      category: dbArticle.category,
      authorId: dbArticle.author_id,
      author: {} as User, // Will be populated separately if needed
      status: dbArticle.status,
      isModerated: dbArticle.is_moderated,
      featuredImage: dbArticle.image_url,
      tags: dbArticle.tags || [],
      likes: dbArticle.likes,
      views: dbArticle.views,
      createdAt: dbArticle.created_at,
      updatedAt: dbArticle.updated_at,
      publishedAt: dbArticle.status === 'published' ? dbArticle.updated_at : undefined,
      comments: []
    };
  }

  async getArticles(status?: 'draft' | 'published' | 'archived' | 'under_review'): Promise<Article[]> {
    const query = supabase.from('articles').select('*');
    if (status) query.eq('status', status);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(article => this.mapArticleFromDB(article));
  }

  async getArticleById(id: string): Promise<Article | null> {
    const { data, error } = await supabase.from('articles').select('*').eq('id', id).single();
    if (error || !data) return null;
    
    // Increment view count
    await supabase.from('articles').update({
      views: data.views + 1,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    
    return this.mapArticleFromDB({ ...data, views: data.views + 1 });
  }

  async getArticlesByAuthor(authorId: string): Promise<Article[]> {
    const { data, error } = await supabase.from('articles').select('*').eq('author_id', authorId).order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(article => this.mapArticleFromDB(article));
  }

  async updateArticle(id: string, updates: Partial<Article>, adminId?: string): Promise<Article | null> {
    const now = new Date().toISOString();
    const updateData: any = {
      updated_at: now
    };
    
    if (updates.title) updateData.title = updates.title;
    if (updates.content) updateData.content = updates.content;
    if (updates.excerpt) updateData.excerpt = updates.excerpt;
    if (updates.category) updateData.category = updates.category;
    if (updates.status) updateData.status = updates.status;
    if (updates.featuredImage) updateData.image_url = updates.featuredImage;
    if (updates.tags) updateData.tags = updates.tags;
    
    const { data, error } = await supabase.from('articles').update(updateData).eq('id', id).select();
    
    if (adminId) {
      await this.logAdminAction(adminId, 'UPDATE_ARTICLE', 'article', id, `Updated article: ${JSON.stringify(updates)}`);
    }
    
    if (error || !data || !data[0]) return null;
    return this.mapArticleFromDB(data[0]);
  }

  async deleteArticle(id: string, adminId?: string): Promise<boolean> {
    const { error } = await supabase.from('articles').delete().eq('id', id);
    
    if (adminId) {
      await this.logAdminAction(adminId, 'DELETE_ARTICLE', 'article', id, 'Deleted article');
    }
    
    return !error;
  }

  async likeArticle(articleId: string, _userId: string): Promise<boolean> {
    // _userId parameter reserved for future use (tracking who liked what)
    const { data: article } = await supabase.from('articles').select('likes').eq('id', articleId).single();
    if (!article) return false;
    
    const { error } = await supabase.from('articles').update({
      likes: article.likes + 1,
      updated_at: new Date().toISOString()
    }).eq('id', articleId);
    
    return !error;
  }

  // Helper method to map Supabase confession data to our Confession type
  private mapConfessionFromDB(dbConfession: any): Confession {
    return {
      id: dbConfession.id,
      authorId: dbConfession.author_id,
      content: dbConfession.content,
      category: dbConfession.category,
      isAnonymous: dbConfession.is_anonymous,
      likes: dbConfession.likes,
      tags: dbConfession.tags || [],
      isModerated: dbConfession.is_moderated,
      createdAt: dbConfession.created_at,
      updatedAt: dbConfession.updated_at,
      comments: [],
      reports: []
    };
  }

  // Confessions
  async createConfession(confessionData: Omit<Confession, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'isModerated' | 'reports'>): Promise<Confession> {
    const now = new Date().toISOString();
    const { data, error } = await supabase.from('confessions').insert({
      author_id: confessionData.authorId,
      content: confessionData.content,
      category: confessionData.category || 'general',
      is_anonymous: confessionData.isAnonymous || false,
      likes: 0,
      tags: confessionData.tags || [],
      is_moderated: false,
      created_at: now,
      updated_at: now
    }).select();
    if (error || !data || !data[0]) throw error || new Error('Failed to create confession');
    return this.mapConfessionFromDB(data[0]);
  }

  async getConfessions(): Promise<Confession[]> {
    const { data, error } = await supabase.from('confessions').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(confession => this.mapConfessionFromDB(confession));
  }

  async getConfessionsByAuthor(authorId: string): Promise<Confession[]> {
    const { data, error } = await supabase.from('confessions').select('*').eq('author_id', authorId).order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(confession => this.mapConfessionFromDB(confession));
  }

  async updateConfession(id: string, updates: Partial<Confession>, adminId?: string): Promise<Confession | null> {
    const now = new Date().toISOString();
    const updateData: any = {
      updated_at: now
    };
    
    if (updates.content) updateData.content = updates.content;
    if (updates.category) updateData.category = updates.category;
    if (updates.isAnonymous !== undefined) updateData.is_anonymous = updates.isAnonymous;
    if (updates.tags) updateData.tags = updates.tags;
    if (updates.isModerated !== undefined) updateData.is_moderated = updates.isModerated;
    
    const { data, error } = await supabase.from('confessions').update(updateData).eq('id', id).select();
    
    if (adminId) {
      await this.logAdminAction(adminId, 'UPDATE_CONFESSION', 'confession', id, `Updated confession: ${JSON.stringify(updates)}`);
    }
    
    if (error || !data || !data[0]) return null;
    return this.mapConfessionFromDB(data[0]);
  }

  async deleteConfession(id: string, authorId: string, adminId?: string): Promise<boolean> {
    // First check if the confession exists and get author info
    const { data: confession } = await supabase.from('confessions').select('author_id').eq('id', id).single();
    
    if (!confession) {
      return false;
    }
    
    // Check permissions: either author deleting own confession, or admin/moderator deleting any
    const canDelete = confession.author_id === authorId || adminId;
    
    if (!canDelete) {
      return false;
    }
    
    const { error } = await supabase.from('confessions').delete().eq('id', id);
    
    if (adminId) {
      await this.logAdminAction(adminId, 'DELETE_CONFESSION', 'confession', id, 'Deleted confession');
    }
    
    return !error;
  }

  async likeConfession(confessionId: string, _userId: string): Promise<boolean> {
    // _userId parameter reserved for future use (tracking who liked what)
    const { data: confession } = await supabase.from('confessions').select('likes').eq('id', confessionId).single();
    if (!confession) return false;
    
    const { error } = await supabase.from('confessions').update({
      likes: confession.likes + 1,
      updated_at: new Date().toISOString()
    }).eq('id', confessionId);
    
    return !error;
  }

  // Initialize data - Supabase handles initialization
  async initializeDemoData(): Promise<void> {
    // Database initialization is handled by Supabase migrations
    return;
  }

  // Fallback methods for localStorage-dependent features (will be converted gradually)
  // Comments for Articles - Using temporary localStorage until Supabase comment system is implemented
  async addComment(articleId: string, commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'isModerated' | 'replies'>): Promise<Comment> {
    // For now, store comments in localStorage until full migration
    const commentsKey = `article_comments_${articleId}`;
    const existingComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
    
    const now = new Date().toISOString();
    const comment: Comment = {
      ...commentData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      likes: 0,
      isModerated: false,
      replies: []
    };

    existingComments.push(comment);
    localStorage.setItem(commentsKey, JSON.stringify(existingComments));
    return comment;
  }

  async replyToComment(articleId: string, parentCommentId: string, replyData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'isModerated' | 'replies' | 'parentCommentId'>): Promise<Comment> {
    const commentsKey = `article_comments_${articleId}`;
    const existingComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
    
    const parentComment = existingComments.find((c: Comment) => c.id === parentCommentId);
    if (!parentComment) throw new Error('Parent comment not found');

    const now = new Date().toISOString();
    const reply: Comment = {
      ...replyData,
      id: crypto.randomUUID(),
      parentCommentId,
      createdAt: now,
      updatedAt: now,
      likes: 0,
      isModerated: false,
      replies: []
    };

    parentComment.replies.push(reply);
    localStorage.setItem(commentsKey, JSON.stringify(existingComments));
    return reply;
  }

  async likeComment(articleId: string, commentId: string, _userId: string): Promise<boolean> {
    const commentsKey = `article_comments_${articleId}`;
    const existingComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
    
    // Find comment in main comments or replies
    let comment = existingComments.find((c: Comment) => c.id === commentId);
    if (!comment) {
      // Search in replies
      for (const mainComment of existingComments) {
        comment = mainComment.replies.find((r: Comment) => r.id === commentId);
        if (comment) break;
      }
    }

    if (!comment) return false;

    comment.likes += 1;
    comment.updatedAt = new Date().toISOString();
    localStorage.setItem(commentsKey, JSON.stringify(existingComments));
    return true;
  }

  async deleteComment(articleId: string, commentId: string, userId: string, isAdmin = false): Promise<boolean> {
    const commentsKey = `article_comments_${articleId}`;
    const existingComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
    
    // Find and remove comment from main comments
    const commentIndex = existingComments.findIndex((c: Comment) => c.id === commentId);
    if (commentIndex !== -1) {
      const comment = existingComments[commentIndex];
      
      if (comment.authorId !== userId && !isAdmin) {
        return false;
      }
      
      existingComments.splice(commentIndex, 1);
      localStorage.setItem(commentsKey, JSON.stringify(existingComments));
      return true;
    }

    // Find and remove comment from replies
    for (const mainComment of existingComments) {
      const replyIndex = mainComment.replies.findIndex((r: Comment) => r.id === commentId);
      if (replyIndex !== -1) {
        const reply = mainComment.replies[replyIndex];
        
        if (reply.authorId !== userId && !isAdmin) {
          return false;
        }
        
        mainComment.replies.splice(replyIndex, 1);
        localStorage.setItem(commentsKey, JSON.stringify(existingComments));
        return true;
      }
    }

    return false;
  }

  // Comments for Confessions - Using temporary localStorage
  async addConfessionComment(confessionId: string, commentData: Omit<ConfessionComment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'isModerated' | 'replies'>): Promise<ConfessionComment> {
    const commentsKey = `confession_comments_${confessionId}`;
    const existingComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');

    const now = new Date().toISOString();
    const comment: ConfessionComment = {
      ...commentData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      likes: 0,
      isModerated: false,
      replies: []
    };

    existingComments.push(comment);
    localStorage.setItem(commentsKey, JSON.stringify(existingComments));
    return comment;
  }

  async replyToConfessionComment(confessionId: string, parentCommentId: string, replyData: Omit<ConfessionComment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'isModerated' | 'replies' | 'parentCommentId'>): Promise<ConfessionComment> {
    const commentsKey = `confession_comments_${confessionId}`;
    const existingComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');

    const parentComment = existingComments.find((c: ConfessionComment) => c.id === parentCommentId);
    if (!parentComment) throw new Error('Parent comment not found');

    const now = new Date().toISOString();
    const reply: ConfessionComment = {
      ...replyData,
      id: crypto.randomUUID(),
      parentCommentId,
      createdAt: now,
      updatedAt: now,
      likes: 0,
      isModerated: false,
      replies: []
    };

    parentComment.replies.push(reply);
    localStorage.setItem(commentsKey, JSON.stringify(existingComments));
    return reply;
  }

  async likeConfessionComment(confessionId: string, commentId: string, _userId: string): Promise<boolean> {
    const commentsKey = `confession_comments_${confessionId}`;
    const existingComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');

    // Find comment in main comments or replies
    let comment = existingComments.find((c: ConfessionComment) => c.id === commentId);
    if (!comment) {
      // Search in replies
      for (const mainComment of existingComments) {
        comment = mainComment.replies.find((r: ConfessionComment) => r.id === commentId);
        if (comment) break;
      }
    }

    if (!comment) return false;

    comment.likes += 1;
    comment.updatedAt = new Date().toISOString();
    localStorage.setItem(commentsKey, JSON.stringify(existingComments));
    return true;
  }

  async deleteConfessionComment(confessionId: string, commentId: string, userId: string, isAdmin = false): Promise<boolean> {
    const commentsKey = `confession_comments_${confessionId}`;
    const existingComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');

    // Find and remove comment from main comments
    const commentIndex = existingComments.findIndex((c: ConfessionComment) => c.id === commentId);
    if (commentIndex !== -1) {
      const comment = existingComments[commentIndex];
      
      if (comment.authorId !== userId && !isAdmin) {
        return false;
      }
      
      existingComments.splice(commentIndex, 1);
      localStorage.setItem(commentsKey, JSON.stringify(existingComments));
      return true;
    }

    // Find and remove comment from replies
    for (const mainComment of existingComments) {
      const replyIndex = mainComment.replies.findIndex((r: ConfessionComment) => r.id === commentId);
      if (replyIndex !== -1) {
        const reply = mainComment.replies[replyIndex];
        
        if (reply.authorId !== userId && !isAdmin) {
          return false;
        }
        
        mainComment.replies.splice(replyIndex, 1);
        localStorage.setItem(commentsKey, JSON.stringify(existingComments));
        return true;
      }
    }

    return false;
  }

  // Enhanced Reaction System - Note: Requires reactions table in Supabase
  async getReactions(targetType: 'article' | 'confession' | 'comment', targetId: string, userId?: string): Promise<ReactionSummary> {
    try {
      const { data: reactions } = await supabase
        .from('reactions')
        .select('*')
        .eq('target_type', targetType)
        .eq('target_id', targetId);

      const reactionArray = reactions || [];
      
      const summary: ReactionSummary = {
        thumbs_up: reactionArray.filter(r => r.type === 'thumbs_up').length,
        heart: reactionArray.filter(r => r.type === 'heart').length,
        insightful: reactionArray.filter(r => r.type === 'insightful').length,
        boring: reactionArray.filter(r => r.type === 'boring').length,
        total: reactionArray.length,
        userReaction: null
      };

      if (userId) {
        const userReaction = reactionArray.find(r => r.user_id === userId);
        summary.userReaction = userReaction?.type || null;
      }

      return summary;
    } catch (error) {
      // Fallback if reactions table doesn't exist yet
      return {
        thumbs_up: 0,
        heart: 0,
        insightful: 0,
        boring: 0,
        total: 0,
        userReaction: null
      };
    }
  }

  async toggleReaction(
    targetType: 'article' | 'confession' | 'comment',
    targetId: string,
    userId: string,
    reactionType: keyof typeof REACTION_TYPES
  ): Promise<ReactionSummary> {
    try {
      // Find existing reaction by this user for this target
      const { data: existingReactions } = await supabase
        .from('reactions')
        .select('*')
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .eq('user_id', userId);

      const existingReaction = existingReactions?.[0];

      if (existingReaction) {
        if (existingReaction.type === reactionType) {
          // Remove reaction if same type
          await supabase.from('reactions').delete().eq('id', existingReaction.id);
        } else {
          // Update reaction type
          await supabase.from('reactions').update({
            type: reactionType,
            created_at: new Date().toISOString()
          }).eq('id', existingReaction.id);
        }
      } else {
        // Add new reaction
        await supabase.from('reactions').insert({
          user_id: userId,
          target_type: targetType,
          target_id: targetId,
          type: reactionType,
          created_at: new Date().toISOString()
        });
      }

      return this.getReactions(targetType, targetId, userId);
    } catch (error) {
      // Fallback if reactions table doesn't exist yet
      return this.getReactions(targetType, targetId, userId);
    }
  }

  async getUserReactions(userId: string): Promise<Reaction[]> {
    try {
      const { data, error } = await supabase.from('reactions').select('*').eq('user_id', userId);
      if (error || !data) return [];
      return data.map(reaction => this.mapReactionFromDB(reaction));
    } catch (error) {
      return [];
    }
  }

  async getReactionsByTarget(targetType: 'article' | 'confession' | 'comment', targetId: string): Promise<Reaction[]> {
    try {
      const { data, error } = await supabase.from('reactions').select('*').eq('target_type', targetType).eq('target_id', targetId);
      if (error || !data) return [];
      return data.map(reaction => this.mapReactionFromDB(reaction));
    } catch (error) {
      return [];
    }
  }

  // Helper method to map Supabase reaction data to our Reaction type
  private mapReactionFromDB(dbReaction: any): Reaction {
    return {
      id: dbReaction.id,
      userId: dbReaction.user_id,
      targetType: dbReaction.target_type,
      targetId: dbReaction.target_id,
      type: dbReaction.type,
      createdAt: dbReaction.created_at
    };
  }

  // Admin Panel Methods
  async getReports(): Promise<Report[]> {
    try {
      const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map(report => this.mapReportFromDB(report));
    } catch (error) {
      console.error('Failed to get reports:', error);
      return [];
    }
  }

  async getAdminLogs(): Promise<AdminLog[]> {
    try {
      const { data, error } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map(log => this.mapAdminLogFromDB(log));
    } catch (error) {
      console.error('Failed to get admin logs:', error);
      return [];
    }
  }

  async getDashboardStats(): Promise<any> {
    try {
      const [usersCount, articlesCount, confessionsCount, reportsCount] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact' }),
        supabase.from('articles').select('*', { count: 'exact' }),
        supabase.from('confessions').select('*', { count: 'exact' }),
        supabase.from('reports').select('*', { count: 'exact' })
      ]);

      return {
        totalUsers: usersCount.count || 0,
        totalArticles: articlesCount.count || 0,
        totalConfessions: confessionsCount.count || 0,
        totalReports: reportsCount.count || 0
      };
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      return {
        totalUsers: 0,
        totalArticles: 0,
        totalConfessions: 0,
        totalReports: 0
      };
    }
  }

  async resolveReport(reportId: string, adminId: string, action: 'resolved' | 'dismissed'): Promise<void> {
    try {
      await supabase.from('reports').update({
        status: action,
        resolved_by: adminId,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', reportId);

      // Log the admin action
      await this.logAdminAction(adminId, `report_${action}`, 'user', reportId, `Report ${action}`);
    } catch (error) {
      console.error('Failed to resolve report:', error);
      throw error;
    }
  }

  // Helper methods for mapping database objects
  private mapReportFromDB(dbReport: any): Report {
    return {
      id: dbReport.id,
      reporterId: dbReport.reporter_id,
      targetType: dbReport.target_type,
      targetId: dbReport.target_id,
      reason: dbReport.reason,
      description: dbReport.description || '',
      status: dbReport.status || 'pending',
      createdAt: dbReport.created_at,
      updatedAt: dbReport.updated_at,
      resolvedBy: dbReport.resolved_by,
      resolvedAt: dbReport.resolved_at
    };
  }

  private mapAdminLogFromDB(dbLog: any): AdminLog {
    return {
      id: dbLog.id,
      adminId: dbLog.admin_id,
      action: dbLog.action,
      targetType: dbLog.target_type,
      targetId: dbLog.target_id,
      details: dbLog.details,
      createdAt: dbLog.created_at
    };
  }
}

export const db = new DatabaseService();

// Export individual functions for direct use
export const getAllUsers = () => db.getUsers();
export const getAllArticles = () => db.getArticles();
export const getAllConfessions = () => db.getConfessions();
export const deleteUser = (userId: string, adminId: string) => db.deleteUser(userId, adminId);
function generateUUID(): string {
  throw new Error('Function not implemented.');
}

