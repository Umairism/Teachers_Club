export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  avatar?: string;
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
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  likes: number;
  comments: Comment[];
  featuredImage?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  authorId: string;
  articleId: string;
  createdAt: string;
  likes: number;
}

export interface Confession {
  id: string;
  content: string;
  authorId: string;
  isAnonymous: boolean;
  createdAt: string;
  likes: number;
  category: 'general' | 'academic' | 'personal' | 'other';
}

export interface DashboardStats {
  totalArticles: number;
  totalConfessions: number;
  totalLikes: number;
  totalComments: number;
  weeklyGrowth: {
    articles: number;
    confessions: number;
    engagement: number;
  };
}
