import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useStats } from '../hooks/useStats';
import { db } from '../lib/database';
import { Article, Confession, User } from '../types';
import { AdminPanel } from '../components/AdminPanel';
import { 
  FileText, 
  MessageCircle, 
  Users, 
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Heart,
  Activity,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export function Dashboard() {    
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useStats();
  const [userArticles, setUserArticles] = useState<Article[]>([]);
  const [userConfessions, setUserConfessions] = useState<Confession[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [allConfessions, setAllConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      if (user.role === 'admin') {
        // Admin can see everything
        const [articles, confessions, users] = await Promise.all([
          db.getArticles(),
          db.getConfessions(),
          db.getUsers()
        ]);

        setAllArticles(articles);
        setAllConfessions(confessions);
        setAllUsers(users);
        setUserArticles(articles.filter(a => a.authorId === user.id));
        setUserConfessions(confessions.filter(c => c.authorId === user.id));
      } else if (user.role === 'moderator') {
        // Moderators can see all content but limited user info
        const [articles, confessions] = await Promise.all([
          db.getArticles(),
          db.getConfessions()
        ]);

        setAllArticles(articles);
        setAllConfessions(confessions);
        setUserArticles(articles.filter(a => a.authorId === user.id));
        setUserConfessions(confessions.filter(c => c.authorId === user.id));
      } else {
        // Teachers and Students only see their own content
        const [articles, confessions] = await Promise.all([
          db.getArticlesByAuthor(user.id),
          db.getConfessionsByAuthor(user.id)
        ]);

        setUserArticles(articles);
        setUserConfessions(confessions);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const deleteArticle = async (articleId: string) => {
    if (user?.permissions.canDeleteContent || user?.role === 'admin') {
      await db.deleteArticle(articleId, user.id);
      loadDashboardData();
    }
  };

  const deleteConfession = async (confessionId: string) => {
    if (user?.permissions.canDeleteContent || user?.role === 'admin' || 
        allConfessions.find(c => c.id === confessionId)?.authorId === user?.id) {
      const success = await db.deleteConfession(confessionId, user!.id);
      if (success) {
        loadDashboardData();
      }
    }
  };

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Role-based stats display
  const getStatsCards = () => {
    if (user?.role === 'admin') {
      return [
        {
          title: 'Total Users',
          value: stats?.totalUsers || 0,
          icon: Users,
          gradient: 'from-blue-500 to-blue-600',
          growth: stats?.weeklyGrowth.users || 0
        },
        {
          title: 'All Articles',
          value: stats?.totalArticles || 0,
          icon: FileText,
          gradient: 'from-green-500 to-green-600',
          growth: stats?.weeklyGrowth.articles || 0
        },
        {
          title: 'All Confessions',
          value: stats?.totalConfessions || 0,
          icon: MessageCircle,
          gradient: 'from-purple-500 to-purple-600',
          growth: stats?.weeklyGrowth.confessions || 0
        },
        {
          title: 'Total Engagement',
          value: (stats?.totalLikes || 0) + (stats?.totalComments || 0),
          icon: Heart,
          gradient: 'from-pink-500 to-pink-600',
          growth: stats?.weeklyGrowth.engagement || 0
        }
      ];
    } else if (user?.role === 'moderator') {
      return [
        {
          title: 'Articles to Review',
          value: allArticles.filter(a => a.status === 'under_review').length,
          icon: FileText,
          gradient: 'from-yellow-500 to-yellow-600',
          growth: 0
        },
        {
          title: 'Confessions to Review',
          value: allConfessions.filter(c => !c.isModerated).length,
          icon: MessageCircle,
          gradient: 'from-orange-500 to-orange-600',
          growth: 0
        },
        {
          title: 'Total Content',
          value: allArticles.length + allConfessions.length,
          icon: Activity,
          gradient: 'from-blue-500 to-blue-600',
          growth: 0
        },
        {
          title: 'Moderated Today',
          value: allArticles.filter(a => a.moderatedBy === user.id && 
            a.moderatedAt && new Date(a.moderatedAt).toDateString() === new Date().toDateString()).length,
          icon: Shield,
          gradient: 'from-green-500 to-green-600',
          growth: 0
        }
      ];
    } else {
      return [
        {
          title: 'Your Articles',
          value: userArticles.length,
          icon: FileText,
          gradient: 'from-blue-500 to-blue-600',
          growth: userArticles.filter(a => 
            new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length
        },
        {
          title: 'Your Confessions',
          value: userConfessions.length,
          icon: MessageCircle,
          gradient: 'from-purple-500 to-purple-600',
          growth: userConfessions.filter(c => 
            new Date(c.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length
        },
        {
          title: 'Total Likes',
          value: userArticles.reduce((sum, a) => sum + a.likes, 0) + 
                 userConfessions.reduce((sum, c) => sum + c.likes, 0),
          icon: Heart,
          gradient: 'from-pink-500 to-pink-600',
          growth: 0
        },
        {
          title: 'Comments Received',
          value: userArticles.reduce((sum, a) => sum + a.comments.length, 0),
          icon: Users,
          gradient: 'from-green-500 to-green-600',
          growth: 0
        }
      ];
    }
  };

  const statCards = getStatsCards();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
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
          {statCards.map((stat) => {
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
                  {stat.growth > 0 && (
                    <div className="flex items-center text-green-600 text-sm font-medium">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +{stat.growth}
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value.toLocaleString()}
                </h3>
                <p className="text-gray-600 text-sm">{stat.title}</p>
              </div>
            );
          })}
        </div>

        {/* Role-based Content Sections */}
        {user?.role === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* All Users Management */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Users className="h-6 w-6 mr-2 text-blue-600" />
                  All Users ({allUsers.length})
                </h2>
                <Link
                  to="/admin"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200"
                >
                  Manage
                </Link>
              </div>
              <div className="space-y-3">
                {allUsers.slice(0, 5).map((userData) => (
                  <div key={userData.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{userData.name}</p>
                      <p className="text-sm text-gray-600">{userData.email}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      userData.role === 'admin' ? 'bg-red-100 text-red-800' :
                      userData.role === 'moderator' ? 'bg-yellow-100 text-yellow-800' :
                      userData.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {userData.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* All Articles Management */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FileText className="h-6 w-6 mr-2 text-green-600" />
                  All Articles ({allArticles.length})
                </h2>
              </div>
              <div className="space-y-3">
                {allArticles.slice(0, 5).map((article) => (
                  <div key={article.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{article.title}</h3>
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => deleteArticle(article.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>By: {article.author.name}</span>
                      <span className={`px-2 py-1 rounded-full ${
                        article.status === 'published' ? 'bg-green-100 text-green-800' :
                        article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {article.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* All Confessions Management */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <MessageCircle className="h-6 w-6 mr-2 text-purple-600" />
                  All Confessions ({allConfessions.length})
                </h2>
              </div>
              <div className="space-y-3">
                {allConfessions.slice(0, 5).map((confession) => (
                  <div key={confession.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-gray-800 line-clamp-2">{confession.content}</p>
                      <button 
                        onClick={() => deleteConfession(confession.id)}
                        className="text-red-400 hover:text-red-600 ml-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{confession.isAnonymous ? 'Anonymous' : 'Public'}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(confession.createdAt), 'MMM d')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {user?.role === 'moderator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Content Moderation */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Shield className="h-6 w-6 mr-2 text-yellow-600" />
                  Articles to Moderate
                </h2>
              </div>
              <div className="space-y-3">
                {allArticles.filter(a => a.status === 'under_review' || !a.isModerated).slice(0, 5).map((article) => (
                  <div key={article.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 text-sm">{article.title}</h3>
                      <div className="flex space-x-1">
                        <button className="text-green-600 hover:text-green-700 text-xs px-2 py-1 bg-green-100 rounded">
                          Approve
                        </button>
                        <button 
                          onClick={() => deleteArticle(article.id)}
                          className="text-red-600 hover:text-red-700 text-xs px-2 py-1 bg-red-100 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">By: {article.author.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <MessageCircle className="h-6 w-6 mr-2 text-purple-600" />
                  Confessions to Moderate
                </h2>
              </div>
              <div className="space-y-3">
                {allConfessions.filter(c => !c.isModerated).slice(0, 5).map((confession) => (
                  <div key={confession.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-gray-800 line-clamp-2">{confession.content}</p>
                      <div className="flex space-x-1 ml-2">
                        <button className="text-green-600 hover:text-green-700 text-xs px-2 py-1 bg-green-100 rounded">
                          Approve
                        </button>
                        <button 
                          onClick={() => deleteConfession(confession.id)}
                          className="text-red-600 hover:text-red-700 text-xs px-2 py-1 bg-red-100 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User's Articles Section - For Teachers and Students */}
          {(user?.role === 'teacher' || user?.role === 'student') && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FileText className="h-6 w-6 mr-2 text-blue-600" />
                  Your Articles
                </h2>
                {user?.permissions.canCreateArticles && (
                  <Link
                    to="/articles"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Article</span>
                  </Link>
                )}
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
                        {user?.permissions.canDeleteContent && (
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
                        )}
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
                    <p className="text-gray-600 mb-4">
                      {user?.permissions.canCreateArticles ? 'No articles yet' : 'You cannot create articles'}
                    </p>
                    {user?.permissions.canCreateArticles && (
                      <Link
                        to="/articles"
                        className="text-blue-600 hover:text-blue-500 font-medium"
                      >
                        Create your first article
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User's Confessions Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <MessageCircle className="h-6 w-6 mr-2 text-purple-600" />
                Your Confessions
              </h2>
              {user?.role === 'teacher' && (
                <Link
                  to="/confessions"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Post</span>
                </Link>
              )}
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
                      {(user?.permissions.canDeleteContent || confession.authorId === user?.id) && (
                        <button 
                          onClick={() => deleteConfession(confession.id)}
                          className="text-gray-400 hover:text-red-600 ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
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
                  <p className="text-gray-600 mb-4">
                    {user?.role === 'teacher' ? 'No confessions yet' : 'Students can only view content'}
                  </p>
                  {user?.role === 'teacher' && (
                    <Link
                      to="/confessions"
                      className="text-purple-600 hover:text-purple-500 font-medium"
                    >
                      Share your first thought
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Admin Panel */}
        {user?.role === 'admin' && (
          <div className="mb-8">
            <AdminPanel user={user} />
          </div>
        )}
      </div>
    </div>
  );
}
