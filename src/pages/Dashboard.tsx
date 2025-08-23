import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/database';
import { Article, Confession, DashboardStats } from '../types';
import { 
  BarChart3, 
  FileText, 
  MessageCircle, 
  Users, 
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Heart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export function Dashboard() {
























    
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    totalConfessions: 0,
    totalLikes: 0,
    totalComments: 0,
    weeklyGrowth: {
      articles: 0,
      confessions: 0,
      engagement: 0
    }
  });
  const [userArticles, setUserArticles] = useState<Article[]>([]);
  const [userConfessions, setUserConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const [articles, confessions, allArticles, allConfessions] = await Promise.all([
        db.getArticlesByAuthor(user.id),
        db.getConfessionsByAuthor(user.id),
        db.getArticles(),
        db.getConfessions()
      ]);

      setUserArticles(articles);
      setUserConfessions(confessions);

      // Calculate stats
      const totalLikes = articles.reduce((sum, article) => sum + article.likes, 0);
      const totalComments = articles.reduce((sum, article) => sum + article.comments.length, 0);

      setStats({
        totalArticles: articles.length,
        totalConfessions: confessions.length,
        totalLikes,
        totalComments,
        weeklyGrowth: {
          articles: 15,
          confessions: 8,
          engagement: 23
        }
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteArticle = async (articleId: string) => {
    // In a real app, you'd implement article deletion
    console.log('Delete article:', articleId);
  };

  const deleteConfession = async (confessionId: string) => {
    const success = await db.deleteConfession(confessionId, user!.id);
    if (success) {
      loadDashboardData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Your Articles',
      value: stats.totalArticles,
      icon: FileText,
      gradient: 'from-blue-500 to-blue-600',
      growth: stats.weeklyGrowth.articles
    },
    {
      title: 'Your Confessions',
      value: stats.totalConfessions,
      icon: MessageCircle,
      gradient: 'from-purple-500 to-purple-600',
      growth: stats.weeklyGrowth.confessions
    },
    {
      title: 'Total Likes',
      value: stats.totalLikes,
      icon: Heart,
      gradient: 'from-pink-500 to-pink-600',
      growth: stats.weeklyGrowth.engagement
    },
    {
      title: 'Comments',
      value: stats.totalComments,
      icon: Users,
      gradient: 'from-green-500 to-green-600',
      growth: 12
    }
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your content and community engagement.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center text-green-600 text-sm font-medium">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +{stat.growth}%
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value.toLocaleString()}
                </h3>
                <p className="text-gray-600 text-sm">{stat.title}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Articles */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-blue-600" />
                Your Recent Articles
              </h2>
              <Link
                to="/articles"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>New Article</span>
              </Link>
            </div>

            <div className="space-y-4">
              {userArticles.length > 0 ? (
                userArticles.slice(0, 3).map((article) => (
                  <div
                    key={article.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {article.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-blue-600">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteArticle(article.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {article.likes}
                        </span>
                        <span className="flex items-center">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {article.comments.length}
                        </span>
                      </div>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(article.createdAt), 'MMM d')}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        article.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {article.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No articles yet</p>
                  <Link
                    to="/articles"
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Create your first article
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Confessions */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <MessageCircle className="h-6 w-6 mr-2 text-purple-600" />
                Your Recent Confessions
              </h2>
              <Link
                to="/confessions"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>New Post</span>
              </Link>
            </div>

            <div className="space-y-4">
              {userConfessions.length > 0 ? (
                userConfessions.slice(0, 3).map((confession) => (
                  <div
                    key={confession.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-gray-800 line-clamp-3">{confession.content}</p>
                      <button 
                        onClick={() => deleteConfession(confession.id)}
                        className="text-gray-400 hover:text-red-600 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          {confession.likes}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          confession.category === 'academic' ? 'bg-blue-100 text-blue-800' :
                          confession.category === 'personal' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {confession.category}
                        </span>
                      </div>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(confession.createdAt), 'MMM d')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No confessions yet</p>
                  <Link
                    to="/confessions"
                    className="text-purple-600 hover:text-purple-500 font-medium"
                  >
                    Share your first thought
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
