/**
 * Shared TypeScript types and interfaces for Pet Clinic Rush.
 * Agent A (gameplay) reads these; Agent B (content) provides config data that matches these shapes.
 * Never edit these unless going through the Contract Change process in COORDINATION/CONTRACT_CHANGES.md.
 */

// ---------------------------------------------------------------------------
// Basic enums
// ---------------------------------------------------------------------------

/** Kind of pet (cat, dog, rabbit, hamster, bird, turtle) */
export type PetKind = 'cat' | 'dog' | 'rabbit' | 'hamster' | 'bird' | 'turtle'

/** Mood of a pet */
export type PetMood = 'idle' | 'sick' | 'happy'

/** Type of need a pet can have */
export type NeedKind =
  | 'need-fever'
  | 'need-wound'
  | 'need-dirty'
  | 'need-hungry'
  | 'need-itchy'
  | 'need-sad'
  | 'need-sleepy'

/** Kind of treatment/tool */
export type ToolKind =
  | 'tool-thermometer'
  | 'tool-medicine'
  | 'tool-bandage'
  | 'tool-sponge'
  | 'tool-rinse'
  | 'tool-food'
  | 'tool-brush'
  | 'tool-heart'
  | 'tool-pillow'

// ---------------------------------------------------------------------------
// Config types – content-provided (Agent B writes files that match these shapes)
// ---------------------------------------------------------------------------

/** Configuration for a single pet type: display name, colour, animation frames, etc. */
export interface PetConfig {
  kind: PetKind
  name: string
  idleAnimation: string       // texture atlas / animation key
  sickAnimation: string
  happyAnimation: string
  color: string               // hex or CSS color for rendering variants
  needs: NeedConfig[]
}

/** Configuration for a single need type: display name, icon, treatment tool, duration. */
export interface NeedConfig {
  kind: NeedKind
  name: string
  icon: string                // asset key for the thought-bubble icon
  tool: ToolKind              // which tool treats this need (may be null for passive needs)
  duration: number            // typical treatment time in seconds
  failPenalty: {              // what happens if treatment fails or times out
    coins: number
    hearts: number
    comboReset: boolean
  }
}

/** Configuration for a single customer: patience, reward, etc. */
export interface CustomerConfig {
  id: number
  patience: number            // ticks before angry (per level modifier)
  baseReward: {               // coins + score per cured pet
    coins: number
    score: number
  }
  angryPenalty: {
    hearts: number
    comboReset: boolean
  }
}

/** Configuration for a single level: spawn rates, bed count, patient modifiers, goals. */
export interface LevelConfig {
  id: number
  timeLimit: number           // seconds to complete the level
  spawnInterval: number       // ms between customer spawns
  patienceMultiplier: number  // modifier applied to customer patience
  maxPetsOnScreen: number
  maxBeds: number             // starts at 3, upgrades allow up to 5
  allowedPets: PetKind[]
  needsPerPet: number         // how many needs a typical pet has in this level
  goal: {                     // win condition
    type: 'curedPets' | 'score'
    target: number
  }
}

/** Configuration for an upgrade purchaseable in the shop. */
export interface UpgradeConfig {
  id: string
  name: string
  description: string
  cost: number                // coins required
  type: 'maxBeds' | 'maxWaitingSlots' | 'patience' | 'toolSpeed' | 'coinBonus' | 'extraSlot' | 'petUnlock' | 'decoration'
  effect: {
    // For maxBeds: new max value; for coinBonus: percentage increase; etc.
    // Defined per-upgrade; read by gameplay systems.
    [key: string]: unknown
  }
}

/** Saved game data – persists between launches via ISaveService. */
export interface SaveData {
  coins: number
  level: number               // current level (1-indexed)
  stars: number               // total stars earned across all levels
  bestScore: number
  unlockedPets: PetKind[]
  upgrades: Record<string, boolean>   // keyed by upgrade id
  dailyStreak: number         // days in a row (0 = never played)
  lastDailyClaim: number      // epoch ms of last claim
  tutorialSeen: boolean
  version: number             // schema version, used for migration
  levelStars?: Record<number, number>
  levelBestScores?: Record<number, number>
}

/** Global game settings that survive a reset but can be changed in Settings. */
export interface GameSettings {
  /** Master volume 0–1 */
  masterVolume: number
  /** SFX volume 0–1 */
  sfxVolume: number
  /** Music volume 0–1 */
  musicVolume: number
  /** Whether sound is enabled */
  sfxEnabled: boolean
  /** Whether music is enabled */
  musicEnabled: boolean
}

// ---------------------------------------------------------------------------
// Game result state
// ---------------------------------------------------------------------------

/** Result of a level – passed from GameScene to ResultScene. */
export interface LevelResult {
  success: boolean            // true if the level was won, false if lost (hearts ran out or time expired)
  curedPets: number           // how many pets were fully cured
  finalScore: number          // score at level end
  coinsEarned: number         // coins awarded
  starRating: number          // 0, 1, 2, or 3
  levelId?: number
  timeRemaining?: number
}

// ---------------------------------------------------------------------------
// Game start data – passed to GameScene on start
// ---------------------------------------------------------------------------

/** Data supplied when starting a level. */
export interface GameSceneData {
  levelId: number
}

// ---------------------------------------------------------------------------
// Result start data – passed to ResultScene
// ---------------------------------------------------------------------------

/** Data supplied when showing the level result. */
export interface ResultSceneData {
  result: LevelResult
  levelId?: number
}

// ---------------------------------------------------------------------------
// Event payload types – the EventBus emits typed payloads
// ---------------------------------------------------------------------------

/** Coins changed – UI listens to update the coin display. */
export type CoinsChanged = {
  type: 'coins:changed'
  payload: { coins: number }
}

/** Score changed – UI listens to update the score display. */
export type ScoreChanged = {
  type: 'score:changed'
  payload: { score: number }
}

/** Hearts changed – UI listens to update the heart display. */
export type HeartsChanged = {
  type: 'hearts:changed'
  payload: { hearts: number }
}

/** Combo changed – UI listens to update the combo display. */
export type ComboChanged = {
  type: 'combo:changed'
  payload: { combo: number; reset: boolean }
}

/** Timer tick – UI listens to count down. */
export type TimerTick = {
  type: 'timer:tick'
  payload: { secondsRemaining: number }
}

/** Level started – gameplay systems initialise. */
export type LevelStarted = {
  type: 'level:started'
  payload: { levelId: number }
}

/** Level completed – gameplay finished successfully. */
export type LevelCompleted = {
  type: 'level:completed'
  payload: { result: LevelResult }
}

/** Level failed – gameplay ended in failure. */
export type LevelFailed = {
  type: 'level:failed'
  payload: { reason: 'time' | 'hearts'; result: LevelResult }
}

/** Pet cured – a pet was fully treated and paid. */
export type PetCured = {
  type: 'pet:cured'
  payload: { petId: number; coins: number; score: number }
}

/** Customer angry – patience ran out, customer left. */
export type CustomerAngry = {
  type: 'customer:angry'
  payload: { petId: number; heartsLost: number; comboReset: boolean }
}

/** Game paused – playback stopped. */
export type GamePause = {
  type: 'game:pause'
  payload: Record<string, never>
}

/** Game resumed – playback continued. */
export type GameResume = {
  type: 'game:resume'
  payload: Record<string, never>
}

/** Audio play – delegate to AudioService. */
export type AudioPlay = {
  type: 'audio:play'
  payload: { key: string; volume?: number }
}

/** Haptic pulse – delegate to HapticsService. */
export type HapticPulse = {
  type: 'haptic:pulse'
  payload: { intensity?: number }
}

/** Tutorial step advanced – UI moves to next step. */
export type TutorialStep = {
  type: 'tutorial:step'
  payload: { stepId: string }
}

// ---------------------------------------------------------------------------
// EventBus – minimal typed pub/sub used by all scenes/systems.
// ---------------------------------------------------------------------------

/** Keyof all event payload types, for convenience. */
export type EventPayloads = {
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
// EventBus: a typed, self-registering pub/sub.
// ---------------------------------------------------

/** Map from event name to array of listeners. */
type ListenerMap = Record<string, Array<(payload: any) => void>>

export class EventBus {
  private listeners: ListenerMap = {}

  /** Subscribe to an event. Returns an unsubscribe function. */
  on<E extends keyof EventPayloads>(event: E, listener: (payload: EventPayloads[E]) => void): () => void {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(listener as (payload: unknown) => void)
    return () => {
      this.listeners[event] = this.listeners[event]!.filter(l => l !== listener)
    }
  }

  /** Emit an event to all listeners. */
  emit<E extends keyof EventPayloads>(event: E, payload: EventPayloads[E]): void {
    const listeners = this.listeners[event] || []
    for (const listener of listeners) {
      listener(payload)
    }
  }

  /** Remove all listeners for a given event (useful on scene shutdown). */
  removeAll(event?: keyof EventPayloads): void {
    if (event) {
      this.listeners[event] = []
    } else {
      this.listeners = {}
    }
  }
}

// Export a singleton so modules can import `export const eventBus = new EventBus()`
// but also allow replacement during tests.
export const eventBus = new EventBus()


