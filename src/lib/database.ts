import { User, Article, Confession, Comment, Report, AdminLog, UserPermissions, ConfessionComment, Reaction, ReactionSummary, REACTION_TYPES } from '../types';
import { supabase, Tables, TablesInsert, TablesUpdate } from './supabase';

// UUID generator function for browser compatibility
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
  // Log admin actions to Supabase
  private async logAdminAction(adminId: string, action: string, targetType: 'user' | 'article' | 'confession' | 'comment', targetId: string, details: string): Promise<void> {
    await supabase.from('admin_logs').insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      created_at: new Date().toISOString()
    });
  }

  // Helper method to map Supabase user data to our User type
  private mapUserFromDB(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
      avatar: dbUser.profile_picture_url,
      bio: dbUser.bio,
      school: dbUser.school,
      subject: dbUser.subject,
      designation: dbUser.designation,
      profilePicture: dbUser.profile_picture_url,
      isActive: dbUser.is_active,
      lastLogin: dbUser.last_login,
      permissions: getUserPermissions(dbUser.role)
    };
  }

  // Users
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'permissions' | 'isActive'>): Promise<User> {
    const now = new Date().toISOString();
    const { data, error } = await supabase.from('users').insert({
      email: userData.email,
      name: userData.name,
      role: userData.role,
      bio: userData.bio || '',
      school: userData.school || '',
      subject: userData.subject || '',
      designation: userData.designation || '',
      profile_picture_url: userData.profilePicture || userData.avatar,
      is_active: true,
      created_at: now,
      updated_at: now
    }).select();
    if (error || !data || !data[0]) throw error || new Error('Failed to create user');
    return this.mapUserFromDB(data[0]);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('is_active', true).single();
    if (error || !data) return null;
    return this.mapUserFromDB(data);
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error || !data) return null;
    return this.mapUserFromDB(data);
  }

  async getUsers(includeInactive = false): Promise<User[]> {
    const data = this.getStorage();
    return includeInactive ? data.users : data.users.filter(user => user.isActive);
  }

  async updateUser(id: string, updates: Partial<User>, adminId?: string): Promise<User | null> {
    const data = this.getStorage();
    const index = data.users.findIndex((user: User) => user.id === id);
    if (index === -1) return null;
    
    const oldUser = data.users[index];
    data.users[index] = {
      ...oldUser,
      ...updates,
      updatedAt: new Date().toISOString(),
      permissions: updates.role ? getUserPermissions(updates.role) : oldUser.permissions
    };
    
    if (adminId) {
      await this.logAdminAction(adminId, 'UPDATE_USER', 'user', id, `Updated user: ${JSON.stringify(updates)}`);
    }
    
    this.setStorage(data);
    return data.users[index];
  }

  async deleteUser(id: string, adminId: string): Promise<boolean> {
    const data = this.getStorage();
    const index = data.users.findIndex((user: User) => user.id === id);
    if (index === -1) return false;
    
    // Soft delete by marking as inactive
    data.users[index].isActive = false;
    data.users[index].updatedAt = new Date().toISOString();
    
    await this.logAdminAction(adminId, 'DELETE_USER', 'user', id, `Deactivated user`);
    this.setStorage(data);
    return true;
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

  // Initialize data - no longer needed for Supabase
  async initializeDemoData(): Promise<void> {
    // Database initialization is handled by Supabase migrations
    return;
  }

  // Reports and Moderation
  async createReport(reportData: Omit<Report, 'id' | 'createdAt' | 'status'>): Promise<Report> {
    const { data, error } = await supabase.from('reports').insert({
      reporter_id: reportData.reporterId,
      reported_content_type: reportData.reportedItemType,
      reported_content_id: reportData.reportedItemId,
      reason: reportData.reason,
      description: reportData.description,
      status: 'pending',
      created_at: new Date().toISOString()
    }).select();
    if (error || !data || !data[0]) throw error || new Error('Failed to create report');
    return this.mapReportFromDB(data[0]);
  }

  // Helper method to map Supabase report data to our Report type
  private mapReportFromDB(dbReport: any): Report {
    return {
      id: dbReport.id,
      reporterId: dbReport.reporter_id,
      reportedItemType: dbReport.reported_content_type,
      reportedItemId: dbReport.reported_content_id,
      reason: dbReport.reason,
      description: dbReport.description,
      status: dbReport.status,
      resolvedBy: dbReport.reviewed_by,
      resolvedAt: dbReport.reviewed_at,
      createdAt: dbReport.created_at
    };
  }

  async getReports(status?: Report['status']): Promise<Report[]> {
    const query = supabase.from('reports').select('*');
    if (status) query.eq('status', status);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(report => this.mapReportFromDB(report));
  }

  async resolveReport(id: string, adminId: string, action: 'resolved' | 'dismissed'): Promise<boolean> {
    const { error } = await supabase.from('reports').update({
      status: action,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString()
    }).eq('id', id);
    
    const { data: report } = await supabase.from('reports').select('reported_content_id, reason').eq('id', id).single();
    if (report) {
      await this.logAdminAction(adminId, 'RESOLVE_REPORT', 'user', report.reported_content_id, `Report ${action}: ${report.reason}`);
    }
    
    return !error;
  }

  // Admin Logs
  async getAdminLogs(limit = 50): Promise<AdminLog[]> {
    const { data, error } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error || !data) return [];
    return data.map(log => this.mapAdminLogFromDB(log));
  }

  // Helper method to map Supabase admin log data to our AdminLog type
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

  // Statistics
  async getDashboardStats(): Promise<any> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Get total counts
    const { data: articles } = await supabase.from('articles').select('likes, views, created_at');
    const { data: confessions } = await supabase.from('confessions').select('likes, created_at');
    const { data: users } = await supabase.from('users').select('created_at, is_active');
    const { data: comments } = await supabase.from('comments').select('id');

    const totalArticles = articles?.length || 0;
    const totalConfessions = confessions?.length || 0;
    const totalUsers = users?.filter(u => u.is_active).length || 0;
    const totalLikes = (articles?.reduce((sum, a) => sum + a.likes, 0) || 0) + (confessions?.reduce((sum, c) => sum + c.likes, 0) || 0);
    const totalComments = comments?.length || 0;
    const totalViews = articles?.reduce((sum, a) => sum + a.views, 0) || 0;

    // Recent data (last week)
    const recentArticles = articles?.filter(a => new Date(a.created_at) > new Date(weekAgo)) || [];
    const recentConfessions = confessions?.filter(c => new Date(c.created_at) > new Date(weekAgo)) || [];
    const recentUsers = users?.filter(u => new Date(u.created_at) > new Date(weekAgo)) || [];

    // Monthly data
    const monthlyArticles = articles?.filter(a => new Date(a.created_at) > new Date(monthAgo)) || [];
    const monthlyConfessions = confessions?.filter(c => new Date(c.created_at) > new Date(monthAgo)) || [];
    const monthlyUsers = users?.filter(u => new Date(u.created_at) > new Date(monthAgo)) || [];

    return {
      totalArticles,
      totalConfessions,
      totalUsers,
      totalLikes,
      totalComments,
      totalViews,
      weeklyGrowth: {
        articles: recentArticles.length,
        confessions: recentConfessions.length,
        users: recentUsers.length,
        engagement: recentArticles.reduce((sum, a) => sum + a.likes, 0) + recentConfessions.reduce((sum, c) => sum + c.likes, 0)
      },
      monthlyStats: {
        articlesPublished: monthlyArticles.length,
        confessionsPosted: monthlyConfessions.length,
        newUsers: monthlyUsers.length,
        totalEngagement: monthlyArticles.reduce((sum, a) => sum + a.likes, 0) + monthlyConfessions.reduce((sum, c) => sum + c.likes, 0)
      }
    };
  }

  // Comments for Articles
  async addComment(articleId: string, commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'isModerated' | 'replies'>): Promise<Comment> {
    const data = this.getStorage();
    const article = data.articles.find(a => a.id === articleId);
    if (!article) throw new Error('Article not found');

    const now = new Date().toISOString();
    const comment: Comment = {
      ...commentData,
      id: generateUUID(),
      createdAt: now,
      updatedAt: now,
      likes: 0,
      isModerated: false,
      replies: []
    };

    article.comments.push(comment);
    article.updatedAt = now;
    this.setStorage(data);
    return comment;
  }

  async replyToComment(articleId: string, parentCommentId: string, replyData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'isModerated' | 'replies' | 'parentCommentId'>): Promise<Comment> {
    const data = this.getStorage();
    const article = data.articles.find(a => a.id === articleId);
    if (!article) throw new Error('Article not found');

    const parentComment = article.comments.find(c => c.id === parentCommentId);
    if (!parentComment) throw new Error('Parent comment not found');

    const now = new Date().toISOString();
    const reply: Comment = {
      ...replyData,
      id: generateUUID(),
      parentCommentId,
      createdAt: now,
      updatedAt: now,
      likes: 0,
      isModerated: false,
      replies: []
    };

    parentComment.replies.push(reply);
    article.updatedAt = now;
    this.setStorage(data);
    return reply;
  }

  async likeComment(articleId: string, commentId: string, _userId: string): Promise<boolean> {
    // _userId parameter reserved for future use (tracking who liked what)
    const data = this.getStorage();
    const article = data.articles.find(a => a.id === articleId);
    if (!article) return false;

    // Find comment in main comments or replies
    let comment = article.comments.find(c => c.id === commentId);
    if (!comment) {
      // Search in replies
      for (const mainComment of article.comments) {
        comment = mainComment.replies.find(r => r.id === commentId);
        if (comment) break;
      }
    }

    if (!comment) return false;

    comment.likes += 1;
    comment.updatedAt = new Date().toISOString();
    article.updatedAt = new Date().toISOString();
    this.setStorage(data);
    return true;
  }

  async deleteComment(articleId: string, commentId: string, userId: string, isAdmin = false): Promise<boolean> {
    const data = this.getStorage();
    const article = data.articles.find(a => a.id === articleId);
    if (!article) {
      return false;
    }

    // Find and remove comment from main comments
    const commentIndex = article.comments.findIndex(c => c.id === commentId);
    if (commentIndex !== -1) {
      const comment = article.comments[commentIndex];
      
      if (comment.authorId !== userId && !isAdmin) {
        return false;
      }
      
      article.comments.splice(commentIndex, 1);
      article.updatedAt = new Date().toISOString();
      this.setStorage(data);
      return true;
    }

    // Find and remove comment from replies
    for (const mainComment of article.comments) {
      const replyIndex = mainComment.replies.findIndex(r => r.id === commentId);
      if (replyIndex !== -1) {
        const reply = mainComment.replies[replyIndex];
        
        if (reply.authorId !== userId && !isAdmin) {
          return false;
        }
        
        mainComment.replies.splice(replyIndex, 1);
        article.updatedAt = new Date().toISOString();
        this.setStorage(data);
        return true;
      }
    }

    return false;
  }

  // Comments for Confessions
  async addConfessionComment(confessionId: string, commentData: Omit<ConfessionComment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'isModerated' | 'replies'>): Promise<ConfessionComment> {
    const data = this.getStorage();
    const confession = data.confessions.find(c => c.id === confessionId);
    if (!confession) throw new Error('Confession not found');

    const now = new Date().toISOString();
    const comment: ConfessionComment = {
      ...commentData,
      id: generateUUID(),
      createdAt: now,
      updatedAt: now,
      likes: 0,
      isModerated: false,
      replies: []
    };

    if (!confession.comments) {
      confession.comments = [];
    }
    confession.comments.push(comment);
    confession.updatedAt = now;
    this.setStorage(data);
    return comment;
  }

  async replyToConfessionComment(confessionId: string, parentCommentId: string, replyData: Omit<ConfessionComment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'isModerated' | 'replies' | 'parentCommentId'>): Promise<ConfessionComment> {
    const data = this.getStorage();
    const confession = data.confessions.find(c => c.id === confessionId);
    if (!confession) throw new Error('Confession not found');

    const parentComment = confession.comments?.find(c => c.id === parentCommentId);
    if (!parentComment) throw new Error('Parent comment not found');

    const now = new Date().toISOString();
    const reply: ConfessionComment = {
      ...replyData,
      id: generateUUID(),
      parentCommentId,
      createdAt: now,
      updatedAt: now,
      likes: 0,
      isModerated: false,
      replies: []
    };

    parentComment.replies.push(reply);
    confession.updatedAt = now;
    this.setStorage(data);
    return reply;
  }

  async likeConfessionComment(confessionId: string, commentId: string, _userId: string): Promise<boolean> {
    // _userId parameter reserved for future use (tracking who liked what)
    const data = this.getStorage();
    const confession = data.confessions.find(c => c.id === confessionId);
    if (!confession || !confession.comments) return false;

    // Find comment in main comments or replies
    let comment = confession.comments.find(c => c.id === commentId);
    if (!comment) {
      // Search in replies
      for (const mainComment of confession.comments) {
        comment = mainComment.replies.find(r => r.id === commentId);
        if (comment) break;
      }
    }

    if (!comment) return false;

    comment.likes += 1;
    comment.updatedAt = new Date().toISOString();
    confession.updatedAt = new Date().toISOString();
    this.setStorage(data);
    return true;
  }

  async deleteConfessionComment(confessionId: string, commentId: string, userId: string, isAdmin = false): Promise<boolean> {
    const data = this.getStorage();
    const confession = data.confessions.find(c => c.id === confessionId);
    if (!confession || !confession.comments) {
      return false;
    }

    // Find and remove comment from main comments
    const commentIndex = confession.comments.findIndex(c => c.id === commentId);
    if (commentIndex !== -1) {
      const comment = confession.comments[commentIndex];
      
      if (comment.authorId !== userId && !isAdmin) {
        return false;
      }
      
      confession.comments.splice(commentIndex, 1);
      confession.updatedAt = new Date().toISOString();
      this.setStorage(data);
      return true;
    }

    // Find and remove comment from replies
    for (const mainComment of confession.comments) {
      const replyIndex = mainComment.replies.findIndex(r => r.id === commentId);
      if (replyIndex !== -1) {
        const reply = mainComment.replies[replyIndex];
        
        if (reply.authorId !== userId && !isAdmin) {
          return false;
        }
        
        mainComment.replies.splice(replyIndex, 1);
        confession.updatedAt = new Date().toISOString();
        this.setStorage(data);
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
}

export const db = new DatabaseService();

// Export individual functions for direct use
export const getAllUsers = () => db.getUsers();
export const getAllArticles = () => db.getArticles();
export const getAllConfessions = () => db.getConfessions();
export const deleteUser = (userId: string, adminId: string) => db.deleteUser(userId, adminId);
