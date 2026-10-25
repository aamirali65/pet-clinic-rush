import type { CustomerConfig } from '@/contracts/types';

export const CUSTOMER_LIST: CustomerConfig[] = [
  {
    id: 0,
    patience: 34,
    baseReward: { coins: 18, score: 16 },
    angryPenalty: { hearts: 1, comboReset: true },
  },
  {
    id: 1,
    patience: 32,
    baseReward: { coins: 20, score: 18 },
    angryPenalty: { hearts: 1, comboReset: true },
  },
  {
    id: 2,
    patience: 38,
    baseReward: { coins: 17, score: 15 },
    angryPenalty: { hearts: 1, comboReset: true },
  },
  {
    id: 3,
    patience: 30,
    baseReward: { coins: 22, score: 20 },
    angryPenalty: { hearts: 1, comboReset: true },
  },
  {
    id: 4,
    patience: 36,
    baseReward: { coins: 19, score: 17 },
    angryPenalty: { hearts: 1, comboReset: true },
  },
  {
    id: 5,
    patience: 28,
    baseReward: { coins: 24, score: 22 },
    angryPenalty: { hearts: 1, comboReset: true },
  },
  {
    id: 6,
    patience: 40,
    baseReward: { coins: 16, score: 14 },
    angryPenalty: { hearts: 1, comboReset: true },
  },
  {
    id: 7,
    patience: 33,
    baseReward: { coins: 21, score: 19 },
    angryPenalty: { hearts: 1, comboReset: true },
  },
];

export const CUSTOMERS: Record<number, CustomerConfig> = Object.fromEntries(
  CUSTOMER_LIST.map((customer) => [customer.id, customer]),
);

export function getCustomer(id: number): CustomerConfig {
  return CUSTOMERS[id % CUSTOMER_LIST.length] ?? CUSTOMER_LIST[0]!;
}
