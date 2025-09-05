import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/database';

export interface LiveStats {
  totalUsers: number;
  totalArticles: number;
  totalConfessions: number;
  publishedArticles: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  activeUsers: number;
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

export function useStats(refreshInterval = 5000) {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const [users, articles, confessions] = await Promise.all([
        db.getUsers(),
        db.getArticles(),
        db.getConfessions()
      ]);

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Calculate weekly growth
      const recentArticles = articles.filter(a => new Date(a.createdAt) > weekAgo);
      const recentConfessions = confessions.filter(c => new Date(c.createdAt) > weekAgo);
      const recentUsers = users.filter(u => new Date(u.createdAt) > weekAgo);

      // Calculate monthly stats
      const monthlyArticles = articles.filter(a => new Date(a.createdAt) > monthAgo);
      const monthlyConfessions = confessions.filter(c => new Date(c.createdAt) > monthAgo);
      const monthlyUsers = users.filter(u => new Date(u.createdAt) > monthAgo);

      // Calculate engagement
      const totalLikes = articles.reduce((sum, a) => sum + a.likes, 0) + 
                        confessions.reduce((sum, c) => sum + c.likes, 0);
      const totalComments = articles.reduce((sum, a) => sum + a.comments.length, 0);
      const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);
      
      const weeklyEngagement = recentArticles.reduce((sum, a) => sum + a.likes + a.comments.length, 0) + 
                              recentConfessions.reduce((sum, c) => sum + c.likes, 0);
      
      const monthlyEngagement = monthlyArticles.reduce((sum, a) => sum + a.likes + a.comments.length, 0) + 
                               monthlyConfessions.reduce((sum, c) => sum + c.likes, 0);

      const liveStats: LiveStats = {
        totalUsers: users.filter(u => u.isActive).length,
        totalArticles: articles.length,
        totalConfessions: confessions.length,
        publishedArticles: articles.filter(a => a.status === 'published').length,
        totalLikes,
        totalComments,
        totalViews,
        activeUsers: users.filter(u => u.isActive && u.lastLogin).length,
        weeklyGrowth: {
          articles: recentArticles.length,
          confessions: recentConfessions.length,
          users: recentUsers.length,
          engagement: weeklyEngagement
        },
        monthlyStats: {
          articlesPublished: monthlyArticles.filter(a => a.status === 'published').length,
          confessionsPosted: monthlyConfessions.length,
          newUsers: monthlyUsers.length,
          totalEngagement: monthlyEngagement
        }
      };

      setStats(liveStats);
      setError(null);
    } catch (err) {
      setError('Failed to fetch statistics');
      console.error('Stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    
    // Set up polling for live updates
    const interval = setInterval(fetchStats, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval]);

  return { stats, loading, error, refetch: fetchStats };
}
