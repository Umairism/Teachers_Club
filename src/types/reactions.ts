export interface Reaction {
  id: string;
  userId: string;
  targetType: 'article' | 'confession' | 'comment';
  targetId: string;
  type: 'thumbs_up' | 'heart' | 'insightful' | 'boring';
  createdAt: string;
}

export interface ReactionSummary {
  thumbs_up: number;
  heart: number;
  insightful: number;
  boring: number;
  total: number;
  userReaction?: 'thumbs_up' | 'heart' | 'insightful' | 'boring' | null;
}

export const REACTION_TYPES = {
  thumbs_up: { emoji: '👍', label: 'Thumbs Up', color: 'text-blue-600' },
  heart: { emoji: '❤️', label: 'Heart', color: 'text-red-600' },
  insightful: { emoji: '💡', label: 'Insightful', color: 'text-yellow-600' },
  boring: { emoji: '😴', label: 'Boring', color: 'text-gray-600' }
} as const;
