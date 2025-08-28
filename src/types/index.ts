export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'moderator' | 'teacher' | 'student';
  createdAt: string;
  updatedAt: string;
  avatar?: string;
  bio?: string;
  school?: string;
  subject?: string;
  isActive: boolean;
  lastLogin?: string;
  permissions: UserPermissions;
}

export interface UserPermissions {
  canCreateArticles: boolean;
  canModerateContent: boolean;
  canManageUsers: boolean;
  canAccessAnalytics: boolean;
  canDeleteContent: boolean;
  canBanUsers: boolean;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: User;
  authorId: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived' | 'under_review';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  likes: number;
  views: number;
  comments: Comment[];
  featuredImage?: string;
  isModerated: boolean;
  moderatedBy?: string;
  moderatedAt?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  authorId: string;
  articleId: string;
  parentCommentId?: string; // For nested comments
  createdAt: string;
  updatedAt: string;
  likes: number;
  isModerated: boolean;
  moderatedBy?: string;
  replies: Comment[];
}

export interface Confession {
  id: string;
  content: string;
  authorId: string;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
  likes: number;
  category: 'general' | 'academic' | 'personal' | 'career' | 'study_tips' | 'other';
  tags: string[];
  isModerated: boolean;
  moderatedBy?: string;
  moderatedAt?: string;
  reports: Report[];
  comments: ConfessionComment[];
}

export interface ConfessionComment {
  id: string;
  content: string;
  author: User;
  authorId: string;
  confessionId: string;
  parentCommentId?: string; // For nested comments
  createdAt: string;
  updatedAt: string;
  likes: number;
  isModerated: boolean;
  moderatedBy?: string;
  replies: ConfessionComment[];
}

export interface Report {
  id: string;
  reporterId: string;
  reportedItemId: string;
  reportedItemType: 'article' | 'confession' | 'comment' | 'user';
  reason: 'spam' | 'inappropriate' | 'harassment' | 'misinformation' | 'other';
  description?: string;
  createdAt: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  targetType: 'user' | 'article' | 'confession' | 'comment';
  targetId: string;
  details: string;
  createdAt: string;
}

export interface DashboardStats {
  totalArticles: number;
  totalConfessions: number;
  totalLikes: number;
  totalComments: number;
  totalUsers: number;
  totalViews: number;
  weeklyGrowth: {
    articles: number;
    confessions: number;
    users: number;
    engagement: number;
  };
  monthlyStats: {
    articlesPublished: number;
    confessionsPosted: number;
    newUsers: number;
    totalEngagement: number;
  };
}
