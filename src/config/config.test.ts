import { describe, expect, it } from 'vitest';
import { CUSTOMER_LIST } from './customers';
import { LEVEL_LIST, LEVEL_TITLES, getStarThresholds } from './levels';
import { NEED_LIST } from './needs';
import { PET_LIST } from './pets';
import { UPGRADE_LIST } from './upgrades';

const TOOL_KEYS = [
  'tool-thermometer',
  'tool-medicine',
  'tool-bandage',
  'tool-sponge',
  'tool-rinse',
  'tool-food',
  'tool-brush',
  'tool-heart',
  'tool-pillow',
];

const PET_KINDS = ['cat', 'dog', 'rabbit', 'hamster', 'bird', 'turtle'];

describe('needs config', () => {
  it('has all seven needs with unique kinds and valid tools', () => {
    expect(NEED_LIST).toHaveLength(7);
    expect(new Set(NEED_LIST.map((need) => need.kind)).size).toBe(7);
    for (const need of NEED_LIST) {
      expect(need.icon).toBe(need.kind);
      expect(TOOL_KEYS).toContain(need.tool);
      expect(need.duration).toBeGreaterThan(0);
      expect(need.failPenalty.coins).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('pets config', () => {
  it('has six pets with unique kinds, textures and four needs each', () => {
    expect(PET_LIST).toHaveLength(6);
    expect(new Set(PET_LIST.map((pet) => pet.kind)).size).toBe(6);
    expect(PET_LIST.map((pet) => pet.kind).sort()).toEqual([...PET_KINDS].sort());
    for (const pet of PET_LIST) {
      expect(pet.idleAnimation).toBe(`pet-${pet.kind}-idle`);
      expect(pet.sickAnimation).toBe(`pet-${pet.kind}-sick`);
      expect(pet.happyAnimation).toBe(`pet-${pet.kind}-happy`);
      expect(pet.needs.length).toBeGreaterThanOrEqual(4);
      expect(pet.needs.every((need) => NEED_LIST.includes(need))).toBe(true);
    }
  });
});

describe('levels config', () => {
  it('has 20 sequential levels and matching titles', () => {
    expect(LEVEL_LIST).toHaveLength(20);
    expect(LEVEL_TITLES).toHaveLength(20);
    LEVEL_LIST.forEach((level, index) => {
      expect(level.id).toBe(index + 1);
    });
  });

  it('has valid goals, times, beds, pets and needs', () => {
    for (const level of LEVEL_LIST) {
      expect(level.timeLimit).toBeGreaterThan(30);
      expect(level.spawnInterval).toBeGreaterThan(1000);
      expect(level.patienceMultiplier).toBeGreaterThan(0.3);
      expect(level.maxBeds).toBeGreaterThanOrEqual(3);
      expect(level.maxBeds).toBeLessThanOrEqual(5);
      expect(level.maxPetsOnScreen).toBeGreaterThanOrEqual(2);
      expect(level.needsPerPet).toBeGreaterThanOrEqual(1);
      expect(level.needsPerPet).toBeLessThanOrEqual(4);
      expect(level.allowedPets.length).toBeGreaterThan(0);
      expect(level.allowedPets.every((kind) => PET_KINDS.includes(kind))).toBe(true);
      expect(level.goal.target).toBeGreaterThan(0);
    }
  });

  it('has a smooth, increasingly difficult curve', () => {
    for (let i = 1; i < LEVEL_LIST.length; i += 1) {
      const previous = LEVEL_LIST[i - 1]!;
      const current = LEVEL_LIST[i]!;
      expect(current.spawnInterval).toBeLessThanOrEqual(previous.spawnInterval);
      expect(current.patienceMultiplier).toBeLessThanOrEqual(previous.patienceMultiplier);
      expect(current.goal.target).toBeGreaterThanOrEqual(previous.goal.target);
      expect(current.needsPerPet).toBeGreaterThanOrEqual(previous.needsPerPet);
      expect(current.maxPetsOnScreen).toBeGreaterThanOrEqual(previous.maxPetsOnScreen);
    }
  });

  it('has ascending star thresholds', () => {
    for (const level of LEVEL_LIST) {
      const [one, two, three] = getStarThresholds(level);
      expect(one).toBeLessThan(two);
      expect(two).toBeLessThan(three);
    }
  });
});

describe('customers config', () => {
  it('has eight unique customers with positive patience and rewards', () => {
    expect(CUSTOMER_LIST).toHaveLength(8);
    expect(new Set(CUSTOMER_LIST.map((customer) => customer.id)).size).toBe(8);
    for (const customer of CUSTOMER_LIST) {
      expect(customer.patience).toBeGreaterThan(10);
      expect(customer.baseReward.coins).toBeGreaterThan(0);
      expect(customer.baseReward.score).toBeGreaterThan(0);
      expect(customer.angryPenalty.hearts).toBeGreaterThan(0);
    }
  });
});

describe('upgrades config', () => {
  it('has unique upgrades with costs and well-formed effects', () => {
    expect(UPGRADE_LIST.length).toBeGreaterThanOrEqual(10);
    expect(new Set(UPGRADE_LIST.map((upgrade) => upgrade.id)).size).toBe(UPGRADE_LIST.length);
    const validTypes = [
      'maxBeds',
      'maxWaitingSlots',
      'patience',
      'toolSpeed',
      'coinBonus',
      'extraSlot',
      'petUnlock',
      'decoration',
    ];
    for (const upgrade of UPGRADE_LIST) {
      expect(upgrade.cost).toBeGreaterThan(0);
      expect(validTypes).toContain(upgrade.type);
      expect(upgrade.name.length).toBeGreaterThan(0);
      if (upgrade.type === 'petUnlock') {
        expect(PET_KINDS).toContain(upgrade.effect.pet);
      }
    }
  });

  it('supports up to five beds through upgrades', () => {
    const bedUpgrades = UPGRADE_LIST.filter((upgrade) => upgrade.type === 'maxBeds');
    expect(bedUpgrades.length).toBeGreaterThanOrEqual(2);
  });
});
