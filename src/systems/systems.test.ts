import { describe, expect, it } from 'vitest';
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
import { LEVEL_LIST, getStarThresholds } from '@/config/levels';
import type { LevelConfig } from '@/contracts/types';
import { LevelSystem } from './LevelSystem';
import { ScoreSystem } from './ScoreSystem';
import { SpawnSystem } from './SpawnSystem';
import { buildLevelResult, calculateStars, goalReached } from './StarSystem';

const LEVEL: LevelConfig = LEVEL_LIST[0]!;

describe('ScoreSystem', () => {
  it('resets to a clean state with the coin bonus applied', () => {
    const system = new ScoreSystem();
    system.cure(20, 30, 2, false);
    system.loseHeart();
    system.reset(25);

    expect(system.score).toBe(0);
    expect(system.coins).toBe(0);
    expect(system.hearts).toBe(STARTING_HEARTS);
    expect(system.combo).toBe(0);
    expect(system.maxCombo).toBe(0);
    expect(system.cured).toBe(0);
    expect(system.coinMultiplier).toBeCloseTo(1.25);
  });

  it('pays base reward plus per-need coins and the quick bonus', () => {
    const system = new ScoreSystem();
    system.reset();
    const reward = system.cure(20, 40, 3, true);

    expect(reward.coins).toBe(20 + 3 * COIN_PER_NEED + FAST_CURE_BONUS_COINS);
    expect(reward.score).toBe(
      Math.round((40 + 3 * SCORE_PER_NEED + FAST_CURE_BONUS_SCORE) * COMBO_MULTIPLIERS[1]!),
    );
    expect(reward.combo).toBe(1);
    expect(reward.multiplier).toBe(COMBO_MULTIPLIERS[1]);
    expect(reward.quick).toBe(true);
    expect(system.coins).toBe(reward.coins);
    expect(system.score).toBe(reward.score);
    expect(system.cured).toBe(1);
  });

  it('applies the coin multiplier to earnings only once', () => {
    const system = new ScoreSystem();
    system.reset(50);
    const reward = system.cure(20, 40, 1, false);

    expect(reward.coins).toBe(Math.round((20 + COIN_PER_NEED) * 1.5));
    expect(reward.score).toBe(Math.round((40 + SCORE_PER_NEED) * COMBO_MULTIPLIERS[1]!));
  });

  it('raises the combo up to the cap and multiplies the score', () => {
    const system = new ScoreSystem();
    system.reset();
    const scores: number[] = [];
    for (let i = 0; i < MAX_COMBO + 3; i += 1) {
      scores.push(system.cure(10, 10, 1, false).score);
    }

    expect(system.combo).toBe(MAX_COMBO);
    expect(system.maxCombo).toBe(MAX_COMBO);
    expect(system.cured).toBe(MAX_COMBO + 3);
    expect(scores[0]).toBe(Math.round((10 + SCORE_PER_NEED) * COMBO_MULTIPLIERS[1]!));
    expect(scores[MAX_COMBO]).toBe(
      Math.round((10 + SCORE_PER_NEED) * COMBO_MULTIPLIERS[MAX_COMBO]!),
    );
    expect(scores[scores.length - 1]).toBe(scores[MAX_COMBO - 1]);
  });

  it('resets the combo without losing score, coins or cured count', () => {
    const system = new ScoreSystem();
    system.reset();
    system.cure(20, 20, 1, false);
    const { score, coins, cured } = system;

    system.resetCombo();

    expect(system.combo).toBe(0);
    expect(system.score).toBe(score);
    expect(system.coins).toBe(coins);
    expect(system.cured).toBe(cured);
  });

  it('loses hearts down to zero and never below', () => {
    const system = new ScoreSystem();
    system.reset();
    for (let i = 0; i < STARTING_HEARTS + 2; i += 1) system.loseHeart();

    expect(system.hearts).toBe(0);
  });

  it('charges the wrong-tool penalty without going negative', () => {
    const system = new ScoreSystem();
    system.reset();
    system.coins = 3;

    expect(system.wrongTool()).toBe(3);
    expect(system.coins).toBe(0);
    expect(system.wrongTool()).toBe(0);
  });

  it('never charges more than the configured penalty', () => {
    const system = new ScoreSystem();
    system.reset();
    system.coins = WRONG_TOOL_PENALTY + 40;

    expect(system.wrongTool()).toBe(WRONG_TOOL_PENALTY);
    expect(system.coins).toBe(40);
  });
});

describe('SpawnSystem', () => {
  it('waits for a full interval before the first spawn', () => {
    const system = new SpawnSystem(2000);
    system.start();

    expect(system.isRunning).toBe(true);
    expect(system.update(1000, true)).toBe(false);
    expect(system.update(1000, true)).toBe(true);
    expect(system.update(10, true)).toBe(false);
  });

  it('holds the timer at the interval while spawning is blocked', () => {
    const system = new SpawnSystem(2000);
    system.start();
    expect(system.update(5000, false)).toBe(false);

    expect(system.update(1, true)).toBe(true);
  });

  it('spawns on a steady cadence after the first arrival', () => {
    const system = new SpawnSystem(1000);
    system.start();
    system.update(1000, true);

    expect(system.update(500, true)).toBe(false);
    expect(system.update(500, true)).toBe(true);
  });

  it('stops spawning until restarted and resets its clock', () => {
    const system = new SpawnSystem(1000);
    system.start();
    system.update(1000, true);
    system.stop();

    expect(system.isRunning).toBe(false);
    expect(system.update(5000, true)).toBe(false);

    system.start();
    expect(system.update(999, true)).toBe(false);
    expect(system.update(1, true)).toBe(true);
  });

  it('adopts a new interval on reset', () => {
    const system = new SpawnSystem(4000);
    system.start();
    system.reset(1500);

    expect(system.update(1499, true)).toBe(false);
    expect(system.update(1, true)).toBe(true);
  });
});

describe('LevelSystem', () => {
  it('starts with the full duration and counts down', () => {
    const system = new LevelSystem(90);
    expect(system.secondsLeft).toBe(90);

    system.start();
    system.update(1000);

    expect(system.secondsLeft).toBe(89);
    expect(system.totalSeconds).toBe(90);
  });

  it('does not count down before start or after stop', () => {
    const system = new LevelSystem(30);
    expect(system.update(5000).ticked).toBe(false);
    expect(system.secondsLeft).toBe(30);

    system.start();
    system.update(1000);
    system.stop();
    system.update(5000);

    expect(system.secondsLeft).toBe(29);
  });

  it('reports ticks at most a few times per second and never below zero', () => {
    const system = new LevelSystem(3);
    system.start();

    let ticks = 0;
    let lastTickAt = 0;
    for (let elapsed = 0; elapsed < 4000; elapsed += 100) {
      const result = system.update(100);
      if (result.ticked) {
        ticks += 1;
        expect(elapsed - lastTickAt).toBeGreaterThanOrEqual(200);
        lastTickAt = elapsed;
      }
    }

    expect(system.secondsLeft).toBe(0);
    expect(ticks).toBeGreaterThan(0);
    expect(ticks).toBeLessThanOrEqual(12);
    expect(system.update(100).expired).toBe(true);
  });

  it('expires exactly once the clock is empty', () => {
    const system = new LevelSystem(1);
    system.start();

    expect(system.update(900).expired).toBe(false);
    expect(system.update(100).expired).toBe(true);
    expect(system.secondsLeft).toBe(0);
  });
});

describe('StarSystem', () => {
  const [, twoStars, threeStars] = getStarThresholds(LEVEL);

  it('awards no stars for a failed level, whatever the score', () => {
    expect(calculateStars({ level: LEVEL, success: false, score: threeStars * 2, hearts: 3 })).toBe(
      0,
    );
  });

  it('awards one star for finishing below the second threshold', () => {
    expect(
      calculateStars({ level: LEVEL, success: true, score: twoStars - 1, hearts: 3 }),
    ).toBe(1);
  });

  it('awards two stars from the second threshold', () => {
    expect(calculateStars({ level: LEVEL, success: true, score: twoStars, hearts: 1 })).toBe(2);
    expect(
      calculateStars({ level: LEVEL, success: true, score: threeStars - 1, hearts: 3 }),
    ).toBe(2);
  });

  it('awards three stars only above the top threshold with two hearts kept', () => {
    expect(calculateStars({ level: LEVEL, success: true, score: threeStars, hearts: 2 })).toBe(3);
    expect(calculateStars({ level: LEVEL, success: true, score: threeStars, hearts: 1 })).toBe(2);
  });

  it('builds a result that rounds the clock and never goes negative', () => {
    const result = buildLevelResult({
      level: LEVEL,
      success: true,
      score: threeStars,
      hearts: 3,
      curedPets: 4,
      coinsEarned: 120,
      timeRemaining: -2.4,
    });

    expect(result).toEqual({
      success: true,
      curedPets: 4,
      finalScore: threeStars,
      coinsEarned: 120,
      starRating: 3,
      levelId: LEVEL.id,
      timeRemaining: 0,
    });
  });

  it('rounds a positive remaining time to whole seconds', () => {
    const result = buildLevelResult({
      level: LEVEL,
      success: false,
      score: 0,
      hearts: 1,
      curedPets: 1,
      coinsEarned: 10,
      timeRemaining: 12.6,
    });

    expect(result.timeRemaining).toBe(13);
    expect(result.starRating).toBe(0);
  });

  it('detects the goal for both goal types', () => {
    const cureLevel: LevelConfig = { ...LEVEL, goal: { type: 'curedPets', target: 4 } };
    expect(goalReached(cureLevel, 3, 9999)).toBe(false);
    expect(goalReached(cureLevel, 4, 0)).toBe(true);

    const scoreLevel: LevelConfig = { ...LEVEL, goal: { type: 'score', target: 500 } };
    expect(goalReached(scoreLevel, 20, 499)).toBe(false);
    expect(goalReached(scoreLevel, 0, 500)).toBe(true);
  });
});
