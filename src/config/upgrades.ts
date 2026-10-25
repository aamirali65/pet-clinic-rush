import type { UpgradeConfig } from '@/contracts/types';

export const UPGRADE_LIST: UpgradeConfig[] = [
  {
    id: 'bed-1',
    name: 'Cozy Bed',
    description: 'Adds a fourth treatment bed.',
    cost: 200,
    type: 'maxBeds',
    effect: { amount: 1 },
  },
  {
    id: 'bed-2',
    name: 'Deluxe Bed',
    description: 'Adds a fifth treatment bed.',
    cost: 450,
    type: 'maxBeds',
    effect: { amount: 1 },
  },
  {
    id: 'waiting-1',
    name: 'Waiting Nook',
    description: 'One extra chair in the waiting area.',
    cost: 180,
    type: 'maxWaitingSlots',
    effect: { amount: 1 },
  },
  {
    id: 'waiting-2',
    name: 'Bigger Waiting Nook',
    description: 'Another chair for busy days.',
    cost: 360,
    type: 'maxWaitingSlots',
    effect: { amount: 1 },
  },
  {
    id: 'patience-1',
    name: 'Soft Music',
    description: 'Customers stay patient 12% longer.',
    cost: 160,
    type: 'patience',
    effect: { multiplier: 0.12 },
  },
  {
    id: 'patience-2',
    name: 'Comfy Sofa',
    description: 'Customers stay patient another 12% longer.',
    cost: 320,
    type: 'patience',
    effect: { multiplier: 0.12 },
  },
  {
    id: 'speed-1',
    name: 'Quick Hands',
    description: 'Treatments are 15% faster.',
    cost: 220,
    type: 'toolSpeed',
    effect: { multiplier: 0.15 },
  },
  {
    id: 'speed-2',
    name: 'Power Tools',
    description: 'Treatments are another 15% faster.',
    cost: 420,
    type: 'toolSpeed',
    effect: { multiplier: 0.15 },
  },
  {
    id: 'coins-1',
    name: 'Tip Jar',
    description: 'Earn 10% more coins from every pet.',
    cost: 300,
    type: 'coinBonus',
    effect: { percent: 10 },
  },
  {
    id: 'coins-2',
    name: 'Gold Star Clinic',
    description: 'Earn another 15% more coins.',
    cost: 600,
    type: 'coinBonus',
    effect: { percent: 15 },
  },
  {
    id: 'pet-hamster',
    name: 'Peanut the Hamster',
    description: 'Unlocks hamsters as patients.',
    cost: 150,
    type: 'petUnlock',
    effect: { pet: 'hamster' },
  },
  {
    id: 'pet-bird',
    name: 'Kiwi the Bird',
    description: 'Unlocks birds as patients.',
    cost: 200,
    type: 'petUnlock',
    effect: { pet: 'bird' },
  },
  {
    id: 'pet-turtle',
    name: 'Pebble the Turtle',
    description: 'Unlocks turtles as patients.',
    cost: 250,
    type: 'petUnlock',
    effect: { pet: 'turtle' },
  },
  {
    id: 'decor-plant',
    name: 'Happy Plant',
    description: 'A leafy friend for the waiting room.',
    cost: 120,
    type: 'decoration',
    effect: { decoration: 'plant' },
  },
  {
    id: 'decor-rug',
    name: 'Sunny Rug',
    description: 'A warm rug for the treatment area.',
    cost: 200,
    type: 'decoration',
    effect: { decoration: 'rug' },
  },
];

export const UPGRADES: Record<string, UpgradeConfig> = Object.fromEntries(
  UPGRADE_LIST.map((upgrade) => [upgrade.id, upgrade]),
);

export const SHOP_SECTIONS = [
  { id: 'clinic', title: 'Clinic', types: ['maxBeds', 'maxWaitingSlots'] },
  { id: 'care', title: 'Care', types: ['patience', 'toolSpeed', 'coinBonus'] },
  { id: 'pets', title: 'Pets', types: ['petUnlock'] },
  { id: 'decor', title: 'Decor', types: ['decoration'] },
] as const;

export function getUpgrade(id: string): UpgradeConfig | undefined {
  return UPGRADES[id];
}
