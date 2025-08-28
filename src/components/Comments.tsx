import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/database';
import { Comment, ConfessionComment } from '../types';
import { 
  MessageCircle, 
  Heart, 
  Reply, 
  Trash2, 
  Send,
  ChevronDown,
  ChevronUp,
  User as UserIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

interface CommentsProps {
  type: 'article' | 'confession';
  itemId: string;
  comments: Comment[] | ConfessionComment[];
  onCommentsUpdate: () => void;
}

export const Comments: React.FC<CommentsProps> = ({ type, itemId, comments, onCommentsUpdate }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const canComment = user && (user.role !== 'student' || type === 'article');

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setLoading(true);
    try {
      if (type === 'article') {
        await db.addComment(itemId, {
          content: newComment.trim(),
          author: user,
          authorId: user.id,
          articleId: itemId
        });
      } else {
        await db.addConfessionComment(itemId, {
          content: newComment.trim(),
          author: user,
          authorId: user.id,
          confessionId: itemId
        });
      }

      setNewComment('');
      onCommentsUpdate();
      toast.success('Comment added successfully!');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyText.trim() || !replyingTo) return;

    setLoading(true);
    try {
      if (type === 'article') {
        await db.replyToComment(itemId, replyingTo, {
          content: replyText.trim(),
          author: user,
          authorId: user.id,
          articleId: itemId
        });
      } else {
        await db.replyToConfessionComment(itemId, replyingTo, {
          content: replyText.trim(),
          author: user,
          authorId: user.id,
          confessionId: itemId
        });
      }

      setReplyText('');
      setReplyingTo(null);
      onCommentsUpdate();
      toast.success('Reply added successfully!');
    } catch (error) {
      toast.error('Failed to add reply');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;

    try {
      if (type === 'article') {
        await db.likeComment(itemId, commentId, user.id);
      } else {
        await db.likeConfessionComment(itemId, commentId, user.id);
      }
      onCommentsUpdate();
    } catch (error) {
      toast.error('Failed to like comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    if (confirm('Are you sure you want to delete this comment?')) {
      try {
        const isAdmin = user.role === 'admin' || user.role === 'moderator';
        let success = false;
        
        if (type === 'article') {
          success = await db.deleteComment(itemId, commentId, user.id, isAdmin);
        } else {
          success = await db.deleteConfessionComment(itemId, commentId, user.id, isAdmin);
        }
        
        if (success) {
          onCommentsUpdate();
          toast.success('Comment deleted successfully!');
        } else {
          toast.error('You can only delete your own comments');
        }
      } catch (error) {
        toast.error('Failed to delete comment');
      }
    }
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const canDeleteComment = (comment: Comment | ConfessionComment) => {
    if (!user) return false;
    return comment.authorId === user.id || user.role === 'admin' || user.role === 'moderator';
  };

  const renderComment = (comment: Comment | ConfessionComment, isReply = false) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedComments.has(comment.id);

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="bg-gray-50 rounded-lg p-4 mb-3">
          {/* Comment Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{comment.author?.name || 'Unknown User'}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            {canDeleteComment(comment) && (
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Comment Content */}
          <p className="text-gray-800 mb-3">{comment.content}</p>

          {/* Comment Actions */}
          <div className="flex items-center space-x-4 text-sm">
            <button
              onClick={() => handleLikeComment(comment.id)}
              className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
              disabled={!user}
            >
              <Heart className="h-4 w-4" />
              <span>{comment.likes}</span>
            </button>

            {canComment && !isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center space-x-1 text-gray-500 hover:text-purple-600 transition-colors"
              >
                <Reply className="h-4 w-4" />
                <span>Reply</span>
              </button>
            )}

            {hasReplies && (
              <button
                onClick={() => toggleReplies(comment.id)}
                className="flex items-center space-x-1 text-gray-500 hover:text-purple-600 transition-colors"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span>{comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <form onSubmit={handleReply} className="mt-3">
              <div className="flex space-x-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  rows={2}
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !replyText.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Replies */}
        {hasReplies && isExpanded && (
          <div className="space-y-2">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-8">
      <div className="flex items-center space-x-2 mb-6">
        <MessageCircle className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Add Comment Form */}
      {canComment ? (
        <form onSubmit={handleAddComment} className="mb-6">
          <div className="flex space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
              <UserIcon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none bg-white text-gray-900"
                rows={3}
                required
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-gray-100 rounded-lg p-4 mb-6 text-center">
          <p className="text-gray-600">
            {!user ? 'Please log in to comment' : 'Only teachers and above can comment on confessions'}
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => renderComment(comment))
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  );
};
