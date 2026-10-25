import { beforeEach, describe, expect, it } from 'vitest';
import { SAVE_KEY, SAVE_VERSION, SETTINGS_KEY } from '@/config/constants';
import { MemoryStorageAdapter, SaveService } from './SaveService';

describe('SaveService', () => {
  let storage: MemoryStorageAdapter;
  let service: SaveService;

  beforeEach(async () => {
    storage = new MemoryStorageAdapter();
    service = new SaveService(storage);
    await service.load();
  });

  it('starts with default progress', () => {
    const data = service.getData();
    expect(data.coins).toBe(150);
    expect(data.level).toBe(1);
    expect(data.unlockedPets).toContain('cat');
    expect(data.levelStars).toEqual({});
    expect(data.version).toBe(SAVE_VERSION);
  });

  it('persists progress and reloads it', async () => {
    service.addCoins(120);
    service.completeLevel({ levelId: 1, stars: 3, score: 900, coinsEarned: 40 });
    service.setTutorialSeen();
    await service.flush();

    const reloaded = new SaveService(storage);
    const data = await reloaded.load();
    expect(data.coins).toBe(150 + 120 + 40);
    expect(data.level).toBe(2);
    expect(data.levelStars[1]).toBe(3);
    expect(data.levelBestScores[1]).toBe(900);
    expect(data.bestScore).toBe(900);
    expect(data.stars).toBe(3);
    expect(data.tutorialSeen).toBe(true);
  });

  it('recovers from corrupt save data', async () => {
    await storage.set(SAVE_KEY, '{not valid json');
    const fresh = new SaveService(storage);
    const data = await fresh.load();
    expect(data.coins).toBe(150);
    expect(await storage.get(`${SAVE_KEY}:corrupt`)).toBe('{not valid json');
  });

  it('migrates a version 1 save', async () => {
    await storage.set(
      SAVE_KEY,
      JSON.stringify({
        coins: 500,
        level: 3,
        stars: 4,
        bestScore: 123,
        unlockedPets: ['cat', 'hamster'],
        upgrades: { 'bed-1': true },
        dailyStreak: 2,
        lastDailyClaim: 1000,
        tutorialSeen: true,
        version: 1,
      }),
    );
    const migrated = new SaveService(storage);
    const data = await migrated.load();
    expect(data.version).toBe(SAVE_VERSION);
    expect(data.coins).toBe(500);
    expect(data.level).toBe(3);
    expect(data.unlockedPets).toContain('hamster');
    expect(data.upgrades['bed-1']).toBe(true);
    expect(data.levelStars).toEqual({});
  });

  it('keeps the best stars and score per level', () => {
    service.completeLevel({ levelId: 1, stars: 2, score: 700, coinsEarned: 20 });
    service.completeLevel({ levelId: 1, stars: 1, score: 900, coinsEarned: 10 });
    expect(service.getLevelStars(1)).toBe(2);
    expect(service.getLevelBestScore(1)).toBe(900);
    expect(service.getTotalStars()).toBe(2);
    expect(service.getData().level).toBe(2);
  });

  it('purchases upgrades and deducts coins', () => {
    service.addCoins(100);
    expect(service.purchaseUpgrade('bed-1', 200)).toBe(true);
    expect(service.hasUpgrade('bed-1')).toBe(true);
    expect(service.getCoins()).toBe(50);
    expect(service.purchaseUpgrade('bed-1', 200)).toBe(false);
    expect(service.purchaseUpgrade('bed-2', 450)).toBe(false);
  });

  it('unlocks pets once', () => {
    expect(service.hasPet('hamster')).toBe(false);
    expect(service.unlockPet('hamster', 50)).toBe(true);
    expect(service.hasPet('hamster')).toBe(true);
    expect(service.unlockPet('hamster')).toBe(false);
    expect(service.getCoins()).toBe(100);
  });

  it('unlocks the next level and clamps at the last level', () => {
    service.completeLevel({ levelId: 1, stars: 1, score: 100, coinsEarned: 0 });
    expect(service.getUnlockedLevel()).toBe(2);
    expect(service.isLevelUnlocked(2)).toBe(true);
    expect(service.isLevelUnlocked(3)).toBe(false);
    service.completeLevel({ levelId: 20, stars: 1, score: 100, coinsEarned: 0 });
    expect(service.getUnlockedLevel()).toBe(20);
  });

  it('runs a seven day daily reward streak and resets after a break', () => {
    const start = Date.UTC(2026, 0, 1, 12);
    let now = start;
    for (let day = 1; day <= 7; day += 1) {
      const info = service.getDailyInfo(now);
      expect(info.canClaim).toBe(true);
      expect(info.day).toBe(day);
      const claim = service.claimDaily(now);
      expect(claim.reward).toBeGreaterThan(0);
      expect(service.getDailyInfo(now + 1000).canClaim).toBe(false);
      now += 24 * 60 * 60 * 1000;
    }
    const eighth = service.getDailyInfo(now);
    expect(eighth.day).toBe(1);
    expect(service.claimDaily(now).day).toBe(1);

    const afterBreak = now + 3 * 24 * 60 * 60 * 1000;
    expect(service.getDailyInfo(afterBreak).day).toBe(1);
  });

  it('persists settings separately from progress', async () => {
    service.setSettings({ musicEnabled: false, vibrationEnabled: false, sfxVolume: 0.4 });
    await service.flush();
    expect(await storage.get(SETTINGS_KEY)).toContain('"musicEnabled":false');

    const reloaded = new SaveService(storage);
    await reloaded.load();
    expect(reloaded.getSettings().musicEnabled).toBe(false);
    expect(reloaded.getSettings().vibrationEnabled).toBe(false);
    expect(reloaded.getSettings().sfxVolume).toBeCloseTo(0.4);
  });

  it('resets progress to defaults', async () => {
    service.addCoins(1000);
    service.completeLevel({ levelId: 1, stars: 3, score: 800, coinsEarned: 0 });
    await service.resetProgress();
    expect(service.getCoins()).toBe(150);
    expect(service.getUnlockedLevel()).toBe(1);
    expect(service.getTotalStars()).toBe(0);
  });
});
