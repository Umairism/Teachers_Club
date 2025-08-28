import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/database';
import { REACTION_TYPES, type ReactionSummary } from '../types';

interface ReactionButtonProps {
  targetType: 'article' | 'confession' | 'comment';
  targetId: string;
  initialReactions?: ReactionSummary;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export function ReactionButton({ 
  targetType, 
  targetId, 
  initialReactions,
  size = 'md',
  showLabels = true 
}: ReactionButtonProps) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<ReactionSummary>(
    initialReactions || {
      thumbs_up: 0,
      heart: 0,
      insightful: 0,
      boring: 0,
      total: 0,
      userReaction: null
    }
  );
  const [isLoading, setIsLoading] = useState(false);

  // Load reactions on component mount
  useEffect(() => {
    loadReactions();
  }, [targetId, targetType, user?.id]);

  const loadReactions = async () => {
    if (!targetId || !targetType) return;
    
    try {
      const reactionData = await db.getReactions(targetType, targetId, user?.id);
      setReactions(reactionData);
    } catch (error) {
      // Fallback to empty reaction data if loading fails
      setReactions({
        thumbs_up: 0,
        heart: 0,
        insightful: 0,
        boring: 0,
        total: 0,
        userReaction: null
      });
    }
  };

  const handleReaction = async (reactionType: keyof typeof REACTION_TYPES) => {
    if (!user) {
      alert('Please log in to react to this content');
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const result = await db.toggleReaction(
        targetType,
        targetId,
        user.id,
        reactionType
      );
      
      setReactions(result);
    } catch (error) {
      // Re-load reactions to ensure UI is in sync
      await loadReactions();
      alert('Failed to update reaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3'
  };

  const emojiSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Object.entries(REACTION_TYPES).map(([type, config]) => {
        const count = reactions[type as keyof typeof REACTION_TYPES];
        const isActive = reactions.userReaction === type;
        
        return (
          <button
            key={type}
            onClick={() => handleReaction(type as keyof typeof REACTION_TYPES)}
            disabled={isLoading}
            className={`
              ${sizeClasses[size]}
              flex items-center gap-1 rounded-full border transition-all duration-200
              ${isActive 
                ? `bg-blue-50 border-blue-300 ${config.color}` 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
              disabled:cursor-not-allowed
            `}
            title={config.label}
          >
            <span className={`${emojiSizes[size]} ${isActive ? 'animate-pulse' : ''}`}>
              {config.emoji}
            </span>
            {count > 0 && (
              <span className={`font-medium ${isActive ? config.color : 'text-gray-600'}`}>
                {count}
              </span>
            )}
            {showLabels && size !== 'sm' && (
              <span className="hidden sm:inline text-xs">
                {config.label}
              </span>
            )}
          </button>
        );
      })}
      
      {reactions.total > 0 && (
        <div className="text-sm text-gray-500 ml-2">
          {reactions.total} reaction{reactions.total !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// Compact version for small spaces
export function CompactReactionButton({ targetType, targetId, initialReactions }: Omit<ReactionButtonProps, 'size' | 'showLabels'>) {
  return (
    <ReactionButton
      targetType={targetType}
      targetId={targetId}
      initialReactions={initialReactions}
      size="sm"
      showLabels={false}
    />
  );
}
