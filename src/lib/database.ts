import { User, Article, Confession, Comment, Report, AdminLog, UserPermissions, ConfessionComment } from '../types';

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
  private storageKey = 'teachers_club_data';
  
  private getStorage(): {
    users: User[];
    articles: Article[];
    confessions: Confession[];
    comments: Comment[];
    reports: Report[];
    adminLogs: AdminLog[];
  } {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : {
      users: [],
      articles: [],
      confessions: [],
      comments: [],
      reports: [],
      adminLogs: []
    };
  }

  private setStorage(data: {
    users: User[];
    articles: Article[];
    confessions: Confession[];
    comments: Comment[];
    reports: Report[];
    adminLogs: AdminLog[];
  }): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  private async logAdminAction(adminId: string, action: string, targetType: 'user' | 'article' | 'confession' | 'comment', targetId: string, details: string): Promise<void> {
    const data = this.getStorage();
    const log: AdminLog = {
      id: generateUUID(),
      adminId,
      action,
      targetType,
      targetId,
      details,
      createdAt: new Date().toISOString()
    };
    data.adminLogs.push(log);
    this.setStorage(data);
  }

  // Users
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'permissions' | 'isActive'>): Promise<User> {
    const data = this.getStorage();
    const now = new Date().toISOString();
    const user: User = {
      ...userData,
      id: generateUUID(),
      createdAt: now,
      updatedAt: now,
      isActive: true,
      permissions: getUserPermissions(userData.role)
    };
    data.users.push(user);
    this.setStorage(data);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const data = this.getStorage();
    return data.users.find((user: User) => user.email === email && user.isActive) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const data = this.getStorage();
    return data.users.find((user: User) => user.id === id) || null;
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
    const data = this.getStorage();
    const now = new Date().toISOString();
    const article: Article = {
      ...articleData,
      id: generateUUID(),
      createdAt: now,
      updatedAt: now,
      publishedAt: articleData.status === 'published' ? now : undefined,
      likes: 0,
      views: 0,
      comments: [],
      isModerated: false
    };
    data.articles.push(article);
    this.setStorage(data);
    return article;
  }

  async getArticles(status?: 'draft' | 'published' | 'archived' | 'under_review'): Promise<Article[]> {
    const data = this.getStorage();
    const articles = data.articles || [];
    return status ? articles.filter((article: Article) => article.status === status) : articles;
  }

  async getArticleById(id: string): Promise<Article | null> {
    const data = this.getStorage();
    const article = data.articles.find((article: Article) => article.id === id);
    if (article) {
      // Increment view count
      article.views = (article.views || 0) + 1;
      article.updatedAt = new Date().toISOString();
      this.setStorage(data);
    }
    return article || null;
  }

  async getArticlesByAuthor(authorId: string): Promise<Article[]> {
    const data = this.getStorage();
    return data.articles.filter((article: Article) => article.authorId === authorId);
  }

  async updateArticle(id: string, updates: Partial<Article>, adminId?: string): Promise<Article | null> {
    const data = this.getStorage();
    const index = data.articles.findIndex((article: Article) => article.id === id);
    if (index === -1) return null;
    
    const now = new Date().toISOString();
    const wasPublished = data.articles[index].status === 'published';
    const isNowPublished = updates.status === 'published';
    
    data.articles[index] = {
      ...data.articles[index],
      ...updates,
      updatedAt: now,
      publishedAt: !wasPublished && isNowPublished ? now : data.articles[index].publishedAt
    };
    
    if (adminId) {
      await this.logAdminAction(adminId, 'UPDATE_ARTICLE', 'article', id, `Updated article: ${JSON.stringify(updates)}`);
    }
    
    this.setStorage(data);
    return data.articles[index];
  }

  async deleteArticle(id: string, adminId?: string): Promise<boolean> {
    const data = this.getStorage();
    const index = data.articles.findIndex((article: Article) => article.id === id);
    if (index === -1) return false;
    
    data.articles.splice(index, 1);
    
    if (adminId) {
      await this.logAdminAction(adminId, 'DELETE_ARTICLE', 'article', id, 'Deleted article');
    }
    
    this.setStorage(data);
    return true;
  }

  async likeArticle(articleId: string, userId: string): Promise<boolean> {
    // userId parameter reserved for future use (tracking who liked what)
    const data = this.getStorage();
    const article = data.articles.find((article: Article) => article.id === articleId);
    if (!article) return false;
    
    article.likes += 1;
    article.updatedAt = new Date().toISOString();
    this.setStorage(data);
    return true;
  }

  // Confessions
  async createConfession(confessionData: Omit<Confession, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'isModerated' | 'reports'>): Promise<Confession> {
    const data = this.getStorage();
    const now = new Date().toISOString();
    const confession: Confession = {
      ...confessionData,
      id: generateUUID(),
      createdAt: now,
      updatedAt: now,
      likes: 0,
      isModerated: false,
      reports: [],
      comments: confessionData.comments || []
    };
    data.confessions.push(confession);
    this.setStorage(data);
    return confession;
  }

  async getConfessions(): Promise<Confession[]> {
    const data = this.getStorage();
    return data.confessions || [];
  }

  async getConfessionsByAuthor(authorId: string): Promise<Confession[]> {
    const data = this.getStorage();
    return data.confessions.filter((confession: Confession) => confession.authorId === authorId);
  }

  async updateConfession(id: string, updates: Partial<Confession>, adminId?: string): Promise<Confession | null> {
    const data = this.getStorage();
    const index = data.confessions.findIndex((confession: Confession) => confession.id === id);
    if (index === -1) return null;
    
    data.confessions[index] = {
      ...data.confessions[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    if (adminId) {
      await this.logAdminAction(adminId, 'UPDATE_CONFESSION', 'confession', id, `Updated confession: ${JSON.stringify(updates)}`);
    }
    
    this.setStorage(data);
    return data.confessions[index];
  }

  async deleteConfession(id: string, authorId: string, adminId?: string): Promise<boolean> {
    const data = this.getStorage();
    const index = data.confessions.findIndex((confession: Confession) => 
      confession.id === id && (confession.authorId === authorId || adminId)
    );
    if (index === -1) return false;
    
    data.confessions.splice(index, 1);
    
    if (adminId) {
      await this.logAdminAction(adminId, 'DELETE_CONFESSION', 'confession', id, 'Deleted confession');
    }
    
    this.setStorage(data);
    return true;
  }

  async likeConfession(confessionId: string, userId: string): Promise<boolean> {
    // userId parameter reserved for future use (tracking who liked what)
    const data = this.getStorage();
    const confession = data.confessions.find((confession: Confession) => confession.id === confessionId);
    if (!confession) return false;
    
    confession.likes += 1;
    confession.updatedAt = new Date().toISOString();
    this.setStorage(data);
    return true;
  }

  // Initialize demo data
  async initializeDemoData(): Promise<void> {
    const data = this.getStorage();
    if (data.users.length > 0) return; // Already initialized

    // Create demo admin user
    const adminUser = await this.createUser({
      email: 'admin@teachers-club.edu',
      name: 'Admin User',
      role: 'admin',
      bio: 'System Administrator',
      school: 'Teachers Club Academy'
    });

    // Create demo teacher user
    const teacherUser = await this.createUser({
      email: 'teacher@teachers-club.edu',
      name: 'John Teacher',
      role: 'teacher',
      bio: 'Mathematics Teacher',
      school: 'Teachers Club Academy',
      subject: 'Mathematics'
    });

    // Create demo student user
    const studentUser = await this.createUser({
      email: 'student@teachers-club.edu',
      name: 'Jane Student',
      role: 'student',
      bio: 'Math enthusiast',
      school: 'Teachers Club Academy'
    });

    // Create demo articles
    await this.createArticle({
      title: 'Welcome to Teachers Club',
      content: 'This is a comprehensive platform for educational excellence. Here you can share knowledge, connect with peers, and build a strong learning community. Our platform supports rich content creation, community discussions, and professional development.',
      excerpt: 'Welcome to our modern educational platform',
      author: adminUser,
      authorId: adminUser.id,
      category: 'announcement',
      tags: ['welcome', 'introduction', 'platform'],
      status: 'published',
      moderatedBy: adminUser.id,
      moderatedAt: new Date().toISOString()
    });

    await this.createArticle({
      title: 'Effective Teaching Strategies in Digital Age',
      content: 'In today\'s digital landscape, educators must adapt their teaching methods to engage students effectively. This article explores various strategies that have proven successful in online and hybrid learning environments.',
      excerpt: 'Exploring modern teaching methods for digital classrooms',
      author: teacherUser,
      authorId: teacherUser.id,
      category: 'education',
      tags: ['teaching', 'digital', 'strategies', 'online-learning'],
      status: 'published',
      moderatedBy: adminUser.id,
      moderatedAt: new Date().toISOString()
    });

    // Create demo confessions
    await this.createConfession({
      content: 'I love the new digital learning environment! It makes studying so much more interactive and engaging.',
      authorId: studentUser.id,
      isAnonymous: true,
      category: 'academic',
      tags: ['digital-learning', 'positive', 'engagement'],
      comments: []
    });

    await this.createConfession({
      content: 'Sometimes I feel overwhelmed with the amount of content to cover in each semester. Any tips for better time management?',
      authorId: teacherUser.id,
      isAnonymous: false,
      category: 'career',
      tags: ['time-management', 'teaching', 'stress'],
      comments: []
    });
  }

  // Reports and Moderation
  async createReport(reportData: Omit<Report, 'id' | 'createdAt' | 'status'>): Promise<Report> {
    const data = this.getStorage();
    const report: Report = {
      ...reportData,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    data.reports.push(report);
    this.setStorage(data);
    return report;
  }

  async getReports(status?: Report['status']): Promise<Report[]> {
    const data = this.getStorage();
    return status ? data.reports.filter(r => r.status === status) : data.reports;
  }

  async resolveReport(id: string, adminId: string, action: 'resolved' | 'dismissed'): Promise<boolean> {
    const data = this.getStorage();
    const report = data.reports.find(r => r.id === id);
    if (!report) return false;
    
    report.status = action;
    report.resolvedBy = adminId;
    report.resolvedAt = new Date().toISOString();
    
    await this.logAdminAction(adminId, 'RESOLVE_REPORT', 'user', report.reportedItemId, `Report ${action}: ${report.reason}`);
    this.setStorage(data);
    return true;
  }

  // Admin Logs
  async getAdminLogs(limit = 50): Promise<AdminLog[]> {
    const data = this.getStorage();
    return data.adminLogs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Statistics
  async getDashboardStats(): Promise<any> {
    const data = this.getStorage();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentArticles = data.articles.filter(a => new Date(a.createdAt) > weekAgo);
    const recentConfessions = data.confessions.filter(c => new Date(c.createdAt) > weekAgo);
    const recentUsers = data.users.filter(u => new Date(u.createdAt) > weekAgo);

    const monthlyArticles = data.articles.filter(a => new Date(a.createdAt) > monthAgo);
    const monthlyConfessions = data.confessions.filter(c => new Date(c.createdAt) > monthAgo);
    const monthlyUsers = data.users.filter(u => new Date(u.createdAt) > monthAgo);

    return {
      totalArticles: data.articles.length,
      totalConfessions: data.confessions.length,
      totalUsers: data.users.filter(u => u.isActive).length,
      totalLikes: data.articles.reduce((sum, a) => sum + a.likes, 0) + data.confessions.reduce((sum, c) => sum + c.likes, 0),
      totalComments: data.articles.reduce((sum, a) => sum + a.comments.length, 0),
      totalViews: data.articles.reduce((sum, a) => sum + a.views, 0),
      weeklyGrowth: {
        articles: recentArticles.length,
        confessions: recentConfessions.length,
        users: recentUsers.length,
        engagement: recentArticles.reduce((sum, a) => sum + a.likes + a.comments.length, 0) + recentConfessions.reduce((sum, c) => sum + c.likes, 0)
      },
      monthlyStats: {
        articlesPublished: monthlyArticles.filter(a => a.status === 'published').length,
        confessionsPosted: monthlyConfessions.length,
        newUsers: monthlyUsers.length,
        totalEngagement: monthlyArticles.reduce((sum, a) => sum + a.likes + a.comments.length, 0) + monthlyConfessions.reduce((sum, c) => sum + c.likes, 0)
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

  async likeComment(articleId: string, commentId: string, userId: string): Promise<boolean> {
    // userId parameter reserved for future use (tracking who liked what)
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
      console.error('Article not found:', articleId);
      return false;
    }

    console.log('Deleting comment:', { commentId, userId, isAdmin, availableComments: article.comments?.map(c => ({ id: c.id, authorId: c.authorId })) });

    // Find and remove comment from main comments
    const commentIndex = article.comments.findIndex(c => c.id === commentId);
    if (commentIndex !== -1) {
      const comment = article.comments[commentIndex];
      console.log('Found main comment:', { comment: comment.id, authorId: comment.authorId, userId, canDelete: comment.authorId === userId || isAdmin });
      
      if (comment.authorId !== userId && !isAdmin) {
        console.log('Permission denied: user cannot delete this comment');
        return false;
      }
      
      article.comments.splice(commentIndex, 1);
      article.updatedAt = new Date().toISOString();
      this.setStorage(data);
      console.log('Main comment deleted successfully');
      return true;
    }

    // Find and remove comment from replies
    for (const mainComment of article.comments) {
      const replyIndex = mainComment.replies.findIndex(r => r.id === commentId);
      if (replyIndex !== -1) {
        const reply = mainComment.replies[replyIndex];
        console.log('Found reply comment:', { reply: reply.id, authorId: reply.authorId, userId, canDelete: reply.authorId === userId || isAdmin });
        
        if (reply.authorId !== userId && !isAdmin) {
          console.log('Permission denied: user cannot delete this reply');
          return false;
        }
        
        mainComment.replies.splice(replyIndex, 1);
        article.updatedAt = new Date().toISOString();
        this.setStorage(data);
        console.log('Reply comment deleted successfully');
        return true;
      }
    }

    console.log('Comment not found:', commentId);
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

  async likeConfessionComment(confessionId: string, commentId: string, userId: string): Promise<boolean> {
    // userId parameter reserved for future use (tracking who liked what)
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
      console.error('Confession not found or has no comments:', confessionId);
      return false;
    }

    console.log('Deleting confession comment:', { commentId, userId, isAdmin, availableComments: confession.comments?.map(c => ({ id: c.id, authorId: c.authorId })) });

    // Find and remove comment from main comments
    const commentIndex = confession.comments.findIndex(c => c.id === commentId);
    if (commentIndex !== -1) {
      const comment = confession.comments[commentIndex];
      console.log('Found main confession comment:', { comment: comment.id, authorId: comment.authorId, userId, canDelete: comment.authorId === userId || isAdmin });
      
      if (comment.authorId !== userId && !isAdmin) {
        console.log('Permission denied: user cannot delete this confession comment');
        return false;
      }
      
      confession.comments.splice(commentIndex, 1);
      confession.updatedAt = new Date().toISOString();
      this.setStorage(data);
      console.log('Main confession comment deleted successfully');
      return true;
    }

    // Find and remove comment from replies
    for (const mainComment of confession.comments) {
      const replyIndex = mainComment.replies.findIndex(r => r.id === commentId);
      if (replyIndex !== -1) {
        const reply = mainComment.replies[replyIndex];
        console.log('Found confession reply comment:', { reply: reply.id, authorId: reply.authorId, userId, canDelete: reply.authorId === userId || isAdmin });
        
        if (reply.authorId !== userId && !isAdmin) {
          console.log('Permission denied: user cannot delete this confession reply');
          return false;
        }
        
        mainComment.replies.splice(replyIndex, 1);
        confession.updatedAt = new Date().toISOString();
        this.setStorage(data);
        console.log('Confession reply comment deleted successfully');
        return true;
      }
    }

    console.log('Confession comment not found:', commentId);
    return false;
  }
}

export const db = new DatabaseService();

// Export individual functions for direct use
export const getAllUsers = () => db.getUsers();
export const getAllArticles = () => db.getArticles();
export const getAllConfessions = () => db.getConfessions();
export const deleteUser = (userId: string, adminId: string) => db.deleteUser(userId, adminId);
