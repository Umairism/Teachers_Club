import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  GraduationCap, 
  UserCheck, 
  FileText, 
  MessageCircle,
  Trash2,
  Edit3,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getAllUsers, getAllArticles, getAllConfessions, deleteUser } from '../lib/database';
import { User, Article, Confession } from '../types';

interface AdminPanelProps {
  user: User;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'articles' | 'confessions'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersData, articlesData, confessionsData] = await Promise.all([
          getAllUsers(),
          getAllArticles(),
          getAllConfessions()
        ]);
        
        setUsers(usersData);
        setArticles(articlesData);
        setConfessions(confessionsData);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4 text-red-500" />;
      case 'moderator': return <UserCheck className="h-4 w-4 text-orange-500" />;
      case 'teacher': return <GraduationCap className="h-4 w-4 text-blue-500" />;
      case 'student': return <Users className="h-4 w-4 text-green-500" />;
      default: return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      moderator: 'bg-orange-100 text-orange-800',
      teacher: 'bg-blue-100 text-blue-800',
      student: 'bg-green-100 text-green-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user.id) {
      alert('You cannot delete your own account!');
      return;
    }

    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUser(userId, user.id);
        setUsers(users.filter(u => u.id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const getUserStats = (userId: string) => {
    const userArticles = articles.filter(a => a.authorId === userId);
    const userConfessions = confessions.filter(c => c.authorId === userId);
    return {
      articles: userArticles.length,
      confessions: userConfessions.length,
      totalLikes: userArticles.reduce((sum, a) => sum + a.likes, 0) + 
                  userConfessions.reduce((sum, c) => sum + c.likes, 0)
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Shield className="h-6 w-6 mr-2" />
          Admin Control Panel
        </h2>
        <p className="text-purple-100 mt-1">Manage users, content, and platform activity</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'articles'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Articles ({articles.length})
          </button>
          <button
            onClick={() => setActiveTab('confessions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'confessions'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageCircle className="h-4 w-4 inline mr-2" />
            Confessions ({confessions.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 mr-3" />
                  <div>
                    <p className="text-sm opacity-90">Admins</p>
                    <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                <div className="flex items-center">
                  <UserCheck className="h-8 w-8 mr-3" />
                  <div>
                    <p className="text-sm opacity-90">Moderators</p>
                    <p className="text-2xl font-bold">{users.filter(u => u.role === 'moderator').length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                <div className="flex items-center">
                  <GraduationCap className="h-8 w-8 mr-3" />
                  <div>
                    <p className="text-sm opacity-90">Teachers</p>
                    <p className="text-2xl font-bold">{users.filter(u => u.role === 'teacher').length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-8 w-8 mr-3" />
                  <div>
                    <p className="text-sm opacity-90">Students</p>
                    <p className="text-2xl font-bold">{users.filter(u => u.role === 'student').length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((userItem) => {
                    const stats = getUserStats(userItem.id);
                    return (
                      <tr key={userItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {userItem.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                              <div className="text-sm text-gray-500">{userItem.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(userItem.role)}`}>
                            {getRoleIcon(userItem.role)}
                            <span className="ml-1 capitalize">{userItem.role}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex space-x-4">
                            <span>{stats.articles} articles</span>
                            <span>{stats.confessions} confessions</span>
                            <span>{stats.totalLikes} likes</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDistanceToNow(new Date(userItem.createdAt), { addSuffix: true })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-purple-600 hover:text-purple-900">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-orange-600 hover:text-orange-900">
                              <Edit3 className="h-4 w-4" />
                            </button>
                            {userItem.id !== user.id && (
                              <button 
                                onClick={() => handleDeleteUser(userItem.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'articles' && (
          <div className="space-y-4">
            {articles.map((article) => (
              <div key={article.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{article.title}</h3>
                    <p className="text-gray-600 mb-3 line-clamp-2">{article.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>By: {users.find(u => u.id === article.authorId)?.name || 'Unknown'}</span>
                      <span>{article.likes} likes</span>
                      <span>{formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button className="text-purple-600 hover:text-purple-900">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-orange-600 hover:text-orange-900">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'confessions' && (
          <div className="space-y-4">
            {confessions.map((confession) => (
              <div key={confession.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-800 mb-3">{confession.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        {confession.isAnonymous 
                          ? 'Anonymous' 
                          : users.find(u => u.id === confession.authorId)?.name || 'Unknown'
                        }
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        confession.category === 'academic' ? 'bg-blue-100 text-blue-800' :
                        confession.category === 'personal' ? 'bg-purple-100 text-purple-800' :
                        confession.category === 'general' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {confession.category}
                      </span>
                      <span>{confession.likes} likes</span>
                      <span>{formatDistanceToNow(new Date(confession.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button className="text-purple-600 hover:text-purple-900">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
