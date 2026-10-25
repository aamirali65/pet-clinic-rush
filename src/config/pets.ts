import type { PetConfig, PetKind } from '@/contracts/types';
import { NEEDS } from './needs';

export const PET_LIST: PetConfig[] = [
  {
    kind: 'cat',
    name: 'Mochi',
    idleAnimation: 'pet-cat-idle',
    sickAnimation: 'pet-cat-sick',
    happyAnimation: 'pet-cat-happy',
    color: '#f6a65d',
    needs: [NEEDS['need-fever'], NEEDS['need-dirty'], NEEDS['need-itchy'], NEEDS['need-sleepy']],
  },
  {
    kind: 'dog',
    name: 'Biscuit',
    idleAnimation: 'pet-dog-idle',
    sickAnimation: 'pet-dog-sick',
    happyAnimation: 'pet-dog-happy',
    color: '#c98b62',
    needs: [NEEDS['need-wound'], NEEDS['need-hungry'], NEEDS['need-dirty'], NEEDS['need-sad']],
  },
  {
    kind: 'rabbit',
    name: 'Clover',
    idleAnimation: 'pet-rabbit-idle',
    sickAnimation: 'pet-rabbit-sick',
    happyAnimation: 'pet-rabbit-happy',
    color: '#e9e2ef',
    needs: [NEEDS['need-fever'], NEEDS['need-hungry'], NEEDS['need-itchy'], NEEDS['need-sleepy']],
  },
  {
    kind: 'hamster',
    name: 'Peanut',
    idleAnimation: 'pet-hamster-idle',
    sickAnimation: 'pet-hamster-sick',
    happyAnimation: 'pet-hamster-happy',
    color: '#f2c879',
    needs: [NEEDS['need-dirty'], NEEDS['need-hungry'], NEEDS['need-sleepy'], NEEDS['need-itchy']],
  },
  {
    kind: 'bird',
    name: 'Kiwi',
    idleAnimation: 'pet-bird-idle',
    sickAnimation: 'pet-bird-sick',
    happyAnimation: 'pet-bird-happy',
    color: '#ffd166',
    needs: [NEEDS['need-wound'], NEEDS['need-sad'], NEEDS['need-sleepy'], NEEDS['need-hungry']],
  },
  {
    kind: 'turtle',
    name: 'Pebble',
    idleAnimation: 'pet-turtle-idle',
    sickAnimation: 'pet-turtle-sick',
    happyAnimation: 'pet-turtle-happy',
    color: '#a8d5a2',
    needs: [NEEDS['need-fever'], NEEDS['need-hungry'], NEEDS['need-dirty'], NEEDS['need-sad']],
  },
];

export const PETS: Record<PetKind, PetConfig> = Object.fromEntries(
  PET_LIST.map((pet) => [pet.kind, pet]),
) as Record<PetKind, PetConfig>;

export const STARTER_PETS: PetKind[] = ['cat', 'dog', 'rabbit'];

export const SHOP_PETS: PetKind[] = ['hamster', 'bird', 'turtle'];

export function getPet(kind: PetKind): PetConfig {
  return PETS[kind];
}

