import {
  COIN_PER_NEED,
  COMBO_MULTIPLIERS,
  FAST_CURE_BONUS_COINS,
  FAST_CURE_BONUS_SCORE,
  MAX_COMBO,
  SCORE_PER_NEED,
  STARTING_HEARTS,
  WRONG_TOOL_PENALTY,
} from '@/config/constants';

export interface CureReward {
  coins: number;
  score: number;
  combo: number;
  multiplier: number;
  quick: boolean;
}

export class ScoreSystem {
  score = 0;
  coins = 0;
  hearts = STARTING_HEARTS;
  combo = 0;
  maxCombo = 0;
  cured = 0;
  coinMultiplier = 1;

  reset(coinBonus = 0): void {
    this.score = 0;
    this.coins = 0;
    this.hearts = STARTING_HEARTS;
    this.combo = 0;
    this.maxCombo = 0;
    this.cured = 0;
    this.coinMultiplier = 1 + Math.max(0, coinBonus) / 100;
  }

  cure(baseCoins: number, baseScore: number, needs: number, quick: boolean): CureReward {
    this.combo = Math.min(MAX_COMBO, this.combo + 1);
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const multiplier = COMBO_MULTIPLIERS[Math.min(this.combo, MAX_COMBO)] ?? 1;
    const quickCoins = quick ? FAST_CURE_BONUS_COINS : 0;
    const quickScore = quick ? FAST_CURE_BONUS_SCORE : 0;
    const coins = Math.round((baseCoins + needs * COIN_PER_NEED + quickCoins) * this.coinMultiplier);
    const score = Math.round((baseScore + needs * SCORE_PER_NEED + quickScore) * multiplier);
    this.coins += coins;
    this.score += score;
    this.cured += 1;
    return { coins, score, combo: this.combo, multiplier, quick };
  }

  loseHeart(): number {
    this.hearts = Math.max(0, this.hearts - 1);
    return this.hearts;
  }

  resetCombo(): void {
    this.combo = 0;
  }

  wrongTool(): number {
    const penalty = Math.min(this.coins, WRONG_TOOL_PENALTY);
    this.coins -= penalty;
    return penalty;
  }
}

