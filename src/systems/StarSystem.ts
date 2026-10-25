import type { LevelConfig, LevelResult } from '@/contracts/types';
import { getStarThresholds } from '@/config/levels';

export interface StarInput {
  level: LevelConfig;
  success: boolean;
  score: number;
  hearts: number;
}

export interface LevelResultInput extends StarInput {
  curedPets: number;
  coinsEarned: number;
  timeRemaining: number;
}

/**
 * 1 star for finishing the level, 2 for reaching the second score threshold,
 * 3 for reaching the third threshold while keeping at least two hearts.
 */
export function calculateStars(input: StarInput): number {
  if (!input.success) return 0;
  const [, twoStars, threeStars] = getStarThresholds(input.level);
  if (input.score >= threeStars && input.hearts >= 2) return 3;
  if (input.score >= twoStars) return 2;
  return 1;
}

/** Build the immutable result object handed to ResultScene / saved to disk. */
export function buildLevelResult(input: LevelResultInput): LevelResult {
  const stars = calculateStars(input);
  return {
    success: input.success,
    curedPets: input.curedPets,
    finalScore: input.score,
    coinsEarned: input.coinsEarned,
    starRating: stars,
    levelId: input.level.id,
    timeRemaining: Math.max(0, Math.round(input.timeRemaining)),
  };
}

/** True when the level goal has been met. */
export function goalReached(level: LevelConfig, curedPets: number, score: number): boolean {
  return level.goal.type === 'score' ? score >= level.goal.target : curedPets >= level.goal.target;
}
