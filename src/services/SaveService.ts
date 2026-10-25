import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { GameSettings, PetKind, SaveData } from '@/contracts/types';
import {
  DAILY_COOLDOWN_MS,
  DAILY_REWARDS,
  DEFAULT_SETTINGS,
  LEVEL_STARS_KEY,
  SAVE_DEBOUNCE_MS,
  SAVE_KEY,
  SAVE_VERSION,
  SETTINGS_KEY,
  STARTING_COINS,
} from '@/config/constants';
import { STARTER_PETS } from '@/config/pets';
import { LEVEL_COUNT } from '@/config/levels';

export interface PersistedSettings extends GameSettings {
  vibrationEnabled: boolean;
}

export interface SaveSnapshot extends SaveData {
  levelStars: Record<number, number>;
  levelBestScores: Record<number, number>;
  settings: PersistedSettings;
}

export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface DailyInfo {
  canClaim: boolean;
  day: number;
  reward: number;
  streak: number;
}

export interface LevelCompletion {
  levelId: number;
  stars: number;
  score: number;
  coinsEarned: number;
}

const VALID_PETS: PetKind[] = ['cat', 'dog', 'rabbit', 'hamster', 'bird', 'turtle'];

function validPet(value: unknown): value is PetKind {
  return typeof value === 'string' && (VALID_PETS as string[]).includes(value);
}

function finite(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  return Math.min(max, Math.max(min, Math.round(finite(value, fallback))));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function createDefaultSave(): SaveSnapshot {
  return {
    coins: STARTING_COINS,
    level: 1,
    stars: 0,
    bestScore: 0,
    unlockedPets: [...STARTER_PETS],
    upgrades: {},
    dailyStreak: 0,
    lastDailyClaim: 0,
    tutorialSeen: false,
    version: SAVE_VERSION,
    levelStars: {},
    levelBestScores: {},
    settings: { ...DEFAULT_SETTINGS },
  };
}

export class LocalStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage may be full or blocked */
    }
  }

  async remove(key: string): Promise<void> {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

export class PreferencesAdapter implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    const result = await Preferences.get({ key });
    return result.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }
}

export class MemoryStorageAdapter implements StorageAdapter {
  private readonly map = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.map.delete(key);
  }
}

function chooseAdapter(): StorageAdapter {
  if (Capacitor.isNativePlatform()) return new PreferencesAdapter();
  if (typeof window !== 'undefined' && 'localStorage' in window) return new LocalStorageAdapter();
  return new MemoryStorageAdapter();
}

function normalizeSettings(raw: unknown): PersistedSettings {
  const value = asRecord(raw);
  return {
    masterVolume: Math.min(1, Math.max(0, finite(value.masterVolume, 1))),
    sfxVolume: Math.min(1, Math.max(0, finite(value.sfxVolume, 0.8))),
    musicVolume: Math.min(1, Math.max(0, finite(value.musicVolume, 0.6))),
    sfxEnabled: typeof value.sfxEnabled === 'boolean' ? value.sfxEnabled : true,
    musicEnabled: typeof value.musicEnabled === 'boolean' ? value.musicEnabled : true,
    vibrationEnabled:
      typeof value.vibrationEnabled === 'boolean' ? value.vibrationEnabled : true,
  };
}

function normalizeSnapshot(raw: unknown): SaveSnapshot {
  const value = asRecord(raw);
  const defaults = createDefaultSave();

  const unlocked = Array.isArray(value.unlockedPets)
    ? value.unlockedPets.filter(validPet)
    : defaults.unlockedPets;
  const upgrades = asRecord(value.upgrades);
  const levelStarsRaw = asRecord(value.levelStars);
  const levelBestRaw = asRecord(value.levelBestScores);
  const levelStars: Record<number, number> = {};
  const levelBestScores: Record<number, number> = {};

  for (let id = 1; id <= LEVEL_COUNT; id += 1) {
    const stars = levelStarsRaw[String(id)];
    const best = levelBestRaw[String(id)];
    if (typeof stars === 'number' && stars > 0) {
      levelStars[id] = clampInt(stars, 0, 3, 0);
    }
    if (typeof best === 'number' && best > 0) {
      levelBestScores[id] = Math.round(best);
    }
  }

  const upgradeFlags: Record<string, boolean> = {};
  for (const [key, flag] of Object.entries(upgrades)) {
    if (flag === true) upgradeFlags[key] = true;
  }

  const mergedUnlocked = Array.from(new Set([...defaults.unlockedPets, ...unlocked]));

  return {
    coins: Math.max(0, Math.round(finite(value.coins, defaults.coins))),
    level: clampInt(value.level, 1, LEVEL_COUNT, 1),
    stars: Math.max(0, Math.round(finite(value.stars, 0))),
    bestScore: Math.max(0, Math.round(finite(value.bestScore, 0))),
    unlockedPets: mergedUnlocked,
    upgrades: upgradeFlags,
    dailyStreak: clampInt(value.dailyStreak, 0, 7, 0),
    lastDailyClaim: Math.max(0, finite(value.lastDailyClaim, 0)),
    tutorialSeen: value.tutorialSeen === true,
    version: SAVE_VERSION,
    levelStars,
    levelBestScores,
    settings: normalizeSettings(value.settings),
  };
}

function migrate(raw: unknown): SaveSnapshot {
  if (!raw || typeof raw !== 'object') return createDefaultSave();
  const value = raw as Record<string, unknown>;
  const version = finite(value.version, 1);
  if (version < 2) {
    const legacy = normalizeSnapshot({
      ...value,
      levelStars: value.levelStars ?? {},
      levelBestScores: value.levelBestScores ?? {},
      settings: value.settings ?? {},
    });
    legacy.version = SAVE_VERSION;
    return legacy;
  }
  return normalizeSnapshot(value);
}

export class SaveService {
  private static singleton: SaveService | null = null;

  private readonly storage: StorageAdapter;
  private data: SaveSnapshot = createDefaultSave();
  private loaded = false;
  private loadPromise: Promise<SaveSnapshot> | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(storage: StorageAdapter = chooseAdapter()) {
    this.storage = storage;
  }

  static get(): SaveService {
    if (!SaveService.singleton) SaveService.singleton = new SaveService();
    return SaveService.singleton;
  }

  async load(): Promise<SaveSnapshot> {
    if (this.loaded) return this.data;
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = (async () => {
      const raw = await this.storage.get(SAVE_KEY);
      if (raw) {
        try {
          this.data = migrate(JSON.parse(raw));
        } catch {
          await this.storage.set(`${SAVE_KEY}:corrupt`, raw);
          this.data = createDefaultSave();
        }
      } else {
        this.data = createDefaultSave();
      }
      const settingsRaw = await this.storage.get(SETTINGS_KEY);
      if (settingsRaw) {
        try {
          this.data.settings = normalizeSettings(JSON.parse(settingsRaw));
        } catch {
          this.data.settings = normalizeSettings({});
        }
      }
      this.loaded = true;
      await this.storage.set(SAVE_KEY, JSON.stringify({ ...this.data, settings: undefined }));
      return this.data;
    })();
    return this.loadPromise;
  }

  async ensureLoaded(): Promise<void> {
    await this.load();
  }

  getData(): SaveSnapshot {
    return this.data;
  }

  getSettings(): PersistedSettings {
    return { ...this.data.settings };
  }

  getCoins(): number {
    return this.data.coins;
  }

  getUnlockedLevel(): number {
    return this.data.level;
  }

  isLevelUnlocked(levelId: number): boolean {
    return levelId <= this.data.level;
  }

  getLevelStars(levelId: number): number {
    return this.data.levelStars[levelId] ?? 0;
  }

  getLevelBestScore(levelId: number): number {
    return this.data.levelBestScores[levelId] ?? 0;
  }

  getTotalStars(): number {
    return Object.values(this.data.levelStars).reduce((sum, value) => sum + value, 0);
  }

  hasUpgrade(id: string): boolean {
    return this.data.upgrades[id] === true;
  }

  hasPet(kind: PetKind): boolean {
    return this.data.unlockedPets.includes(kind);
  }

  addCoins(amount: number): number {
    this.data.coins = Math.max(0, Math.round(this.data.coins + amount));
    this.queueSave();
    return this.data.coins;
  }

  spendCoins(amount: number): boolean {
    if (amount < 0 || this.data.coins < amount) return false;
    this.data.coins -= Math.round(amount);
    this.queueSave();
    return true;
  }

  purchaseUpgrade(id: string, cost: number): boolean {
    if (this.hasUpgrade(id)) return false;
    if (!this.spendCoins(cost)) return false;
    this.data.upgrades[id] = true;
    this.queueSave();
    return true;
  }

  unlockPet(kind: PetKind, cost = 0): boolean {
    if (this.hasPet(kind)) return false;
    if (cost > 0 && !this.spendCoins(cost)) return false;
    this.data.unlockedPets.push(kind);
    this.queueSave();
    return true;
  }

  completeLevel(completion: LevelCompletion): SaveSnapshot {
    const { levelId, stars, score, coinsEarned } = completion;
    this.data.coins = Math.max(0, Math.round(this.data.coins + coinsEarned));
    this.data.levelStars[levelId] = Math.max(
      this.data.levelStars[levelId] ?? 0,
      clampInt(stars, 0, 3, 0),
    );
    this.data.levelBestScores[levelId] = Math.max(
      this.data.levelBestScores[levelId] ?? 0,
      Math.round(score),
    );
    this.data.stars = this.getTotalStars();
    this.data.bestScore = Math.max(this.data.bestScore, Math.round(score));
    this.data.level = Math.min(LEVEL_COUNT, Math.max(this.data.level, levelId + 1));
    this.queueSave();
    return this.data;
  }

  setTutorialSeen(seen = true): void {
    this.data.tutorialSeen = seen;
    this.queueSave();
  }

  getDailyInfo(now = Date.now()): DailyInfo {
    const elapsed = now - this.data.lastDailyClaim;
    const streak = this.data.dailyStreak;
    const canClaim = this.data.lastDailyClaim === 0 || elapsed >= DAILY_COOLDOWN_MS;
    let day = 1;
    if (canClaim && this.data.lastDailyClaim > 0 && elapsed < 48 * 60 * 60 * 1000) {
      day = (streak % 7) + 1;
    }
    return {
      canClaim,
      day,
      reward: DAILY_REWARDS[day - 1] ?? DAILY_REWARDS[0],
      streak,
    };
  }

  claimDaily(now = Date.now()): { reward: number; day: number } {
    const info = this.getDailyInfo(now);
    if (!info.canClaim) return { reward: 0, day: info.day };
    this.data.dailyStreak = info.day;
    this.data.lastDailyClaim = now;
    this.data.coins += info.reward;
    this.queueSave();
    return { reward: info.reward, day: info.day };
  }

  setSettings(partial: Partial<PersistedSettings>): PersistedSettings {
    this.data.settings = normalizeSettings({ ...this.data.settings, ...partial });
    this.queueSave();
    return this.getSettings();
  }

  async resetProgress(): Promise<void> {
    const settings = this.getSettings();
    this.data = createDefaultSave();
    this.data.settings = settings;
    this.loaded = true;
    await this.storage.remove(LEVEL_STARS_KEY);
    await this.storage.set(SAVE_KEY, JSON.stringify({ ...this.data, settings: undefined }));
    await this.storage.set(SETTINGS_KEY, JSON.stringify(this.data.settings));
  }

  async flush(): Promise<void> {
    if (this.saveTimer != null) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    await this.persist();
  }

  private queueSave(): void {
    if (this.saveTimer != null) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.persist();
    }, SAVE_DEBOUNCE_MS);
  }

  private async persist(): Promise<void> {
    const snapshot = JSON.stringify({ ...this.data, settings: undefined });
    const settings = JSON.stringify(this.data.settings);
    this.writeChain = this.writeChain
      .then(async () => {
        await this.storage.set(SAVE_KEY, snapshot);
        await this.storage.set(SETTINGS_KEY, settings);
      })
      .catch((error) => {
        console.warn('Save failed', error);
      });
    await this.writeChain;
  }
}

export const save = SaveService.get();



