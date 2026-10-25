export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;
export const HUD_HEIGHT = 140;
export const SAFE_TOP = 24;
export const SAFE_BOTTOM = 18;

export const STARTING_HEARTS = 3;
export const MAX_HEARTS = 3;
export const MAX_COMBO = 5;
export const COMBO_MULTIPLIERS = [1, 1.25, 1.5, 2, 2.5, 3] as const;

export const STARTING_COINS = 150;
export const COIN_PER_NEED = 8;
export const SCORE_PER_NEED = 12;
export const FAST_CURE_BONUS_COINS = 10;
export const FAST_CURE_BONUS_SCORE = 20;
export const FAST_CURE_SECONDS = 12;
export const WRONG_TOOL_PENALTY = 5;

export const DEFAULT_BEDS = 3;
export const MAX_BEDS = 5;
export const DEFAULT_WAITING_SLOTS = 3;
export const MAX_WAITING_SLOTS = 5;

export const DEFAULT_PATIENCE = 34;
export const CUSTOMER_SPAWN_MIN_GAP = 1200;

export const SAVE_KEY = 'pet-clinic-rush:save';
export const SAVE_VERSION = 2;
export const SAVE_DEBOUNCE_MS = 300;

export const DAILY_REWARDS = [50, 75, 100, 125, 150, 200, 300] as const;
export const DAILY_COOLDOWN_MS = 20 * 60 * 60 * 1000;

export const TUTORIAL_STEPS = ['pick', 'place', 'treat'] as const;
export type TutorialStepId = (typeof TUTORIAL_STEPS)[number];

export const LEVEL_STARS_KEY = 'pet-clinic-rush:levels';
export const SETTINGS_KEY = 'pet-clinic-rush:settings';

export const DEFAULT_SETTINGS = {
  masterVolume: 1,
  sfxVolume: 0.8,
  musicVolume: 0.6,
  sfxEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
} as const;

export const LOW_PATIENCE_RATIO = 0.25;
export const ANGRY_LEAVE_SECONDS = 1.2;
export const BED_HIGHLIGHT_RADIUS = 150;
