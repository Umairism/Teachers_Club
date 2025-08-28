import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/database';
import { toast } from 'react-hot-toast';

interface LikeButtonProps {
  type: 'article' | 'confession';
  itemId: string;
  initialLikes: number;
  onLikeUpdate?: (newLikes: number) => void;
  className?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({ 
  type, 
  itemId, 
  initialLikes, 
  onLikeUpdate,
  className = '' 
}) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState(initialLikes);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please log in to like this content');
      return;
    }

    if (isLiking) return;

    setIsLiking(true);
    try {
      if (type === 'article') {
        await db.likeArticle(itemId, user.id);
      } else {
        await db.likeConfession(itemId, user.id);
      }
      
      const newLikes = likes + 1;
      setLikes(newLikes);
      onLikeUpdate?.(newLikes);
      toast.success('Thanks for the like! ❤️');
    } catch (error) {
      console.error('Error liking content:', error);
      toast.error('Failed to like content');
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={!user || isLiking}
      className={`flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <Heart 
        className={`h-4 w-4 transition-all duration-200 ${
          isLiking ? 'scale-110 text-red-500' : ''
        }`} 
      />
      <span className="font-medium">{likes}</span>
    </button>
  );
};
