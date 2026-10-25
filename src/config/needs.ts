import type { NeedConfig, NeedKind } from '@/contracts/types';

export const NEED_LIST: NeedConfig[] = [
  {
    kind: 'need-fever',
    name: 'Fever',
    icon: 'need-fever',
    tool: 'tool-thermometer',
    duration: 4,
    failPenalty: { coins: 5, hearts: 0, comboReset: false },
  },
  {
    kind: 'need-wound',
    name: 'Wound',
    icon: 'need-wound',
    tool: 'tool-bandage',
    duration: 2.5,
    failPenalty: { coins: 5, hearts: 0, comboReset: false },
  },
  {
    kind: 'need-dirty',
    name: 'Dirty',
    icon: 'need-dirty',
    tool: 'tool-sponge',
    duration: 4,
    failPenalty: { coins: 5, hearts: 0, comboReset: false },
  },
  {
    kind: 'need-hungry',
    name: 'Hungry',
    icon: 'need-hungry',
    tool: 'tool-food',
    duration: 3,
    failPenalty: { coins: 5, hearts: 0, comboReset: false },
  },
  {
    kind: 'need-itchy',
    name: 'Itchy',
    icon: 'need-itchy',
    tool: 'tool-brush',
    duration: 3.5,
    failPenalty: { coins: 5, hearts: 0, comboReset: false },
  },
  {
    kind: 'need-sad',
    name: 'Sad',
    icon: 'need-sad',
    tool: 'tool-heart',
    duration: 3,
    failPenalty: { coins: 5, hearts: 0, comboReset: false },
  },
  {
    kind: 'need-sleepy',
    name: 'Sleepy',
    icon: 'need-sleepy',
    tool: 'tool-pillow',
    duration: 3,
    failPenalty: { coins: 5, hearts: 0, comboReset: false },
  },
];

export const NEEDS: Record<NeedKind, NeedConfig> = Object.fromEntries(
  NEED_LIST.map((need) => [need.kind, need]),
) as Record<NeedKind, NeedConfig>;

export function getNeed(kind: NeedKind): NeedConfig {
  return NEEDS[kind];
}
