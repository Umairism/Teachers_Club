import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/database';
import { Confession } from '../types';
import { Comments } from '../components/Comments';
import { LikeButton } from '../components/LikeButton';
import { 
  MessageCircle, 
  Plus, 
  Trash2,
  Filter,
  Clock,
  User,
  Lock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export function Confessions() {
  const { user } = useAuth();
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newConfession, setNewConfession] = useState({
    content: '',
    category: 'general' as const,
    isAnonymous: true,
    tags: [] // Add empty tags array
  });

  // Check if user can create confessions (teachers and admins only)
  const canCreateConfession = user?.role === 'teacher' || user?.role === 'admin';
  const [expandedConfession, setExpandedConfession] = useState<string | null>(null);

  useEffect(() => {
    loadConfessions();
  }, []);

  const loadConfessions = async () => {
    try {
      const data = await db.getConfessions();
      setConfessions(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Failed to load confessions:', error);
      toast.error('Failed to load confessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Only teachers can create confessions
    if (user.role !== 'teacher' && user.role !== 'admin') {
      toast.error('Only teachers can create confessions');
      return;
    }

    try {
      await db.createConfession({
        ...newConfession,
        authorId: user.id,
        tags: [], // Add empty tags array
        comments: [] // Add empty comments array
      });

      toast.success('Confession shared successfully!');
      setShowCreateForm(false);
      setNewConfession({
        content: '',
        category: 'general',
        isAnonymous: true,
        tags: []
      });
      loadConfessions();
    } catch (error) {
      console.error('Failed to create confession:', error);
      toast.error('Failed to share confession');
    }
  };

  const handleDeleteConfession = async (confessionId: string) => {
    if (!user) return;
    
    const confession = confessions.find(c => c.id === confessionId);
    if (!confession) return;

    // Check permissions - Admin, moderators, or confession author can delete
    const canDelete = user.permissions.canDeleteContent || 
                     user.permissions.canModerateContent || 
                     user.id === confession.authorId;
    
    if (!canDelete) {
      toast.error('You do not have permission to delete this confession');
      return;
    }

    if (window.confirm('Are you sure you want to delete this confession?')) {
      const success = await db.deleteConfession(confessionId, user.id);
      if (success) {
        toast.success('Confession deleted successfully');
        loadConfessions();
      } else {
        toast.error('Failed to delete confession');
      }
    }
  };

  const filteredConfessions = confessions.filter(confession => {
    return selectedCategory === 'all' || confession.category === selectedCategory;
  });

  const categories = ['all', 'general', 'academic', 'personal', 'other'];

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'academic': return 'bg-blue-100 text-blue-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      case 'general': return 'bg-green-100 text-green-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading confessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Confessions</h1>
          <p className="text-gray-600 mb-6">
            Share your thoughts anonymously and connect with others in the community
          </p>
          {canCreateConfession && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Share Your Thoughts</span>
            </button>
          )}
          {!canCreateConfession && (
            <p className="text-gray-500 italic">
              Only teachers can share confessions in this community
            </p>
          )}
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Confessions Feed */}
        <div className="space-y-6">
          {filteredConfessions.map((confession) => (
            <div
              key={confession.id}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                    {confession.isAnonymous ? (
                      <Lock className="h-5 w-5 text-white" />
                    ) : (
                      <User className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {confession.isAnonymous ? 'Anonymous' : 'Community Member'}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(confession.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                {/* Delete button for own confessions or admins/moderators */}
                {(user?.id === confession.authorId || user?.role === 'admin' || user?.role === 'moderator') && (
                  <button
                    onClick={() => handleDeleteConfession(confession.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                    title={user?.id === confession.authorId ? 'Delete your confession' : 'Moderate confession'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Content */}
              <p className="text-gray-800 text-lg leading-relaxed mb-4">
                {confession.content}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <LikeButton 
                    type="confession" 
                    itemId={confession.id} 
                    initialLikes={confession.likes}
                    onLikeUpdate={() => loadConfessions()}
                  />
                  <button
                    onClick={() => setExpandedConfession(expandedConfession === confession.id ? null : confession.id)}
                    className="flex items-center space-x-1 text-gray-500 hover:text-purple-600 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>{confession.comments?.length || 0}</span>
                  </button>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(confession.category)}`}>
                    {confession.category}
                  </span>
                </div>
              </div>

              {/* Expanded Comments Section */}
              {expandedConfession === confession.id && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Comments
                    type="confession"
                    itemId={confession.id}
                    comments={confession.comments || []}
                    onCommentsUpdate={loadConfessions}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredConfessions.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No confessions found</h3>
            <p className="text-gray-600 mb-6">
              {selectedCategory !== 'all' 
                ? 'Try selecting a different category' 
                : 'Be the first to share something with the community'
              }
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
            >
              Share First Confession
            </button>
          </div>
        )}

        {/* Create Confession Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Share Your Thoughts</h2>
                <p className="text-gray-600 mt-1">Express yourself freely and anonymously</p>
              </div>
              
              <form onSubmit={handleCreateConfession} className="p-6 space-y-6">
                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What's on your mind?
                  </label>
                  <textarea
                    value={newConfession.content}
                    onChange={(e) => setNewConfession({ ...newConfession, content: e.target.value })}
                    rows={6}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 resize-none"
                    placeholder="Share your thoughts, feelings, or experiences..."
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newConfession.category}
                    onChange={(e) => setNewConfession({ ...newConfession, category: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200"
                  >
                    <option value="general">General</option>
                    <option value="academic">Academic</option>
                    <option value="personal">Personal</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={newConfession.isAnonymous}
                    onChange={(e) => setNewConfession({ ...newConfession, isAnonymous: e.target.checked })}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <label htmlFor="anonymous" className="text-sm text-gray-700">
                    Post anonymously
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                  >
                    Share Confession
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
