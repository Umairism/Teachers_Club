import React from 'react';
import { ReactionButton } from './ReactionButton';

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
  // Legacy component - now uses new reaction system
  // Maps old "likes" to new "heart" reactions for backwards compatibility
  const targetType = type === 'article' ? 'article' : 'confession';
  
  return (
    <div className={className}>
      <ReactionButton
        targetType={targetType}
        targetId={itemId}
        initialReactions={{
          thumbs_up: 0,
          heart: initialLikes,
          insightful: 0,
          boring: 0,
          total: initialLikes,
          userReaction: null
        }}
        size="sm"
        showLabels={false}
      />
    </div>
  );
};
