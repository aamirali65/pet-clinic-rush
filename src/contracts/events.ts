/**
 * EventBus event names and payload types for Pet Clinic Rush.
 * Gameplay (Agent A) EMITS events; UI (Agent B) LISTENS to events.
 * Never import private details of other agents' files; only import from src/contracts/**.
 *
 * Usage:
 *   import { eventBus } from '@/contracts/events'
 *   eventBus.emit('coins:changed', { coins: 123 })
 *
 *   // Listening (in UI/Scenes):
 *   eventBus.on('coins:changed', ({ coins }) => updateHud(coins))
 */

import { eventBus } from './types'
import type {
  LevelResult,
  GameSceneData,
  ResultSceneData,
  PetKind,
  NeedKind,
  ToolKind,
  PetConfig,
  NeedConfig,
  CustomerConfig,
  LevelConfig,
  UpgradeConfig,
  SaveData,
  GameSettings,
  PetMood,
} from './types'

/**
 * ——— Event-payload type aliases (re-exported from types.ts) ———
 *
 * These are the canonical payload types. Consumers should pattern-match on
 * `event.type` rather than checking instanceof.
 */

// Re-export everything from types so imports stay simple
export type {
  LevelResult,
  GameSceneData,
  ResultSceneData,
  PetKind,
  NeedKind,
  ToolKind,
  PetConfig,
  NeedConfig,
  CustomerConfig,
  LevelConfig,
  UpgradeConfig,
  SaveData,
  GameSettings,
  PetMood,
}

// ---------------------------------------------------
// Event payloads – precise types for the EventBus.
// ---------------------------------------------------

export type CoinsChanged = {
  type: 'coins:changed'
  payload: { coins: number }
}

export type ScoreChanged = {
  type: 'score:changed'
  payload: { score: number }
}

export type HeartsChanged = {
  type: 'hearts:changed'
  payload: { hearts: number }
}

export type ComboChanged = {
  type: 'combo:changed'
  payload: { combo: number; reset: boolean }
}

export type TimerTick = {
  type: 'timer:tick'
  payload: { secondsRemaining: number }
}

export type LevelStarted = {
  type: 'level:started'
  payload: { levelId: number }
}

export type LevelCompleted = {
  type: 'level:completed'
  payload: { result: LevelResult }
}

export type LevelFailed = {
  type: 'level:failed'
  payload: { reason: 'time' | 'hearts'; result: LevelResult }
}

export type PetCured = {
  type: 'pet:cured'
  payload: { petId: number; coins: number; score: number }
}

export type CustomerAngry = {
  type: 'customer:angry'
  payload: { petId: number; heartsLost: number; comboReset: boolean }
}

export type GamePause = {
  type: 'game:pause'
  payload: Record<string, never>
}

export type GameResume = {
  type: 'game:resume'
  payload: Record<string, never>
}

export type AudioPlay = {
  type: 'audio:play'
  payload: { key: string; volume?: number }
}

export type HapticPulse = {
  type: 'haptic:pulse'
  payload: { intensity?: number }
}

export type TutorialStep = {
  type: 'tutorial:step'
  payload: { stepId: string }
}

// ---------------------------------------------------
// Optional: Event name constants (string literals)
// Useful for switch statements and avoiding typos.
// ---------------------------------------------------

export const enum EventNames {
  CoinsChanged = 'coins:changed',
  ScoreChanged = 'score:changed',
  HeartsChanged = 'hearts:changed',
  ComboChanged = 'combo:changed',
  TimerTick = 'timer:tick',
  LevelStarted = 'level:started',
  LevelCompleted = 'level:completed',
  LevelFailed = 'level:failed',
  PetCured = 'pet:cured',
  CustomerAngry = 'customer:angry',
  GamePause = 'game:pause',
  GameResume = 'game:resume',
  AudioPlay = 'audio:play',
  HapticPulse = 'haptic:pulse',
  TutorialStep = 'tutorial:step',
}

// ---------------------------------------------------
// Convenience: broadcast an event by name string.
// ---------------------------------------------------

/** Emit an event by its string name, casting the payload. */
export function emitEvent<
  E extends string,
  P = unknown,
>(event: E, payload: P): void {
  ;(eventBus as any).emit(event, payload)
}

// ---------------------------------------------------
// Types for the EventBus class – keep it typed.
// ---------------------------------------------------

/** Map from event name to expected payload type. */
export type EventMap = {
  'coins:changed': { coins: number }
  'score:changed': { score: number }
  'hearts:changed': { hearts: number }
  'combo:changed': { combo: number; reset: boolean }
  'timer:tick': { secondsRemaining: number }
  'level:started': { levelId: number }
  'level:completed': { result: LevelResult }
  'level:failed': { reason: 'time' | 'hearts'; result: LevelResult }
  'pet:cured': { petId: number; coins: number; score: number }
  'customer:angry': { petId: number; heartsLost: number; comboReset: boolean }
  'game:pause': Record<string, never>
  'game:resume': Record<string, never>
  'audio:play': { key: string; volume?: number }
  'haptic:pulse': { intensity?: number }
  'tutorial:step': { stepId: string }
}

// ---------------------------------------------------
// Export a pre-configured EventBus instance.
// ---------------------------------------------------

export const bus = eventBus;


