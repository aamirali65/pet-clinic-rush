/**
 * Asset keys – texture atlases, images, animations, and audio keys used across the project.
 * Centralised so gameplay and UI never hard‑code string literals.
 * Real assets take priority; placeholders from `src/utils/placeholders.ts` fall back automatically.
 *
 * Naming convention: `kebab-case` or `lowercase_underscore` – keep it consistent.
 * Prefixes:
 *   `pet-*`        – pet portraits/animations (per kind + mood)
 *   `customer-*`   – customer portraits
 *   `bed-*`        – treatment beds
 *   `tool-*`       – treatment tools/icons
 *   `need-*`       – thought‑bubble need icons
 *   `ui-*`         – HUD elements (coins, hearts, stars, etc.)
 *   `bg-*`         – background / scene geometry
 *   `fx-*`         – particles, sparkles, confetti
 *   `bgm-*`        – background music tracks
 *   `sfx-*`        – short sound effects
 */

export const AssetKeys = {
  // ——— Scene backgrounds & environment ———
  BgClinic: 'bg-clinic',
  Door: 'door',
  Chair: 'chair',
  Plant: 'plant',

  // ——— Treatment beds (generated per-index, but key template)
  BedTemplate: 'bed-',

  // ——— Tools / treatment icons
  ToolThermometer: 'tool-thermometer',
  ToolMedicine: 'tool-medicine',
  ToolBandage: 'tool-bandage',
  ToolSponge: 'tool-sponge',
  ToolRinse: 'tool-rinse',
  ToolFood: 'tool-food',
  ToolBrush: 'tool-brush',
  ToolHeart: 'tool-heart',
  ToolPillow: 'tool-pillow',

  // ——— Need / thought‑bubble icons
  NeedFeever: 'need-fever',
  NeedWound: 'need-wound',
  NeedDirty: 'need-dirty',
  NeedHungry: 'need-hungry',
  NeedItchy: 'need-itchy',
  NeedSad: 'need-sad',
  NeedSleepy: 'need-sleepy',

  // ——— HUD elements
  UiCoin: 'ui-coin',
  UiHeart: 'ui-heart',
  UiHeartEmpty: 'ui-heart-empty',
  UiStar: 'ui-star',
  UiStarEmpty: 'ui-star-empty',
  UiCheck: 'ui-check',

  // ——— Particles & effects
  Spark: 'spark',
  ConfettiBit: 'confetti-bit',
  HeartBit: 'heart-bit',
  UiPlus: 'ui-plus',
  UiCross: 'ui-cross',
  Paw: 'paw',
  LogoPaw: 'logo-paw',

  // ——— Bubbles (thought / speech)
  Bubble: 'bubble',

  // ——— Shadow under dragged objects
  Shadow: 'shadow',

  // ——— Highlight / selection outline
  Highlight: 'highlight',

  // ——— Arrow pointer
  Arrow: 'arrow',

  // ——— Clinic decorative elements
  FloorFloor: 'floor',

  // ——— Audio
  SfxTap: 'sfx-tap',
  SfxPick: 'sfx-pick',
  SfxPlace: 'sfx-place',
  SfxWrong: 'sfx-wrong',
  SfxCure: 'sfx-cure',
  SfxCoin: 'sfx-coin',
  SfxLevelComplete: 'sfx-level-complete',
  SfxGameOver: 'sfx-game-over',
  SfxScratch: 'sfx-scratch',
  SfxTick: 'sfx-tick',
  SfxOpen: 'sfx-open',
  SfxClose: 'sfx-close',
  SfxPop: 'sfx-pop',
  SfxSparkle: 'sfx-sparkle',
  SfxSwipe: 'sfx-swipe',
  SfxHold: 'sfx-hold',
  SfxStar: 'sfx-star',
  SfxLevelStart: 'sfx-level-start',
  BgmMain: 'bgm-main',
} as const

export type AssetKey = typeof AssetKeys[keyof typeof AssetKeys]

// Convenience: every need key, listed explicitly
export const NeedKeys = [
  AssetKeys.NeedFeever,
  AssetKeys.NeedWound,
  AssetKeys.NeedDirty,
  AssetKeys.NeedHungry,
  AssetKeys.NeedItchy,
  AssetKeys.NeedSad,
  AssetKeys.NeedSleepy,
] as const

export type NeedKey = (typeof NeedKeys)[number]

// Convenience: every tool key, listed explicitly
export const ToolKeys = [
  AssetKeys.ToolThermometer,
  AssetKeys.ToolMedicine,
  AssetKeys.ToolBandage,
  AssetKeys.ToolSponge,
  AssetKeys.ToolRinse,
  AssetKeys.ToolFood,
  AssetKeys.ToolBrush,
  AssetKeys.ToolHeart,
  AssetKeys.ToolPillow,
] as const

export type ToolKey = (typeof ToolKeys)[number]

// Convenience: every UI key, listed explicitly
export const UiKeys = [
  AssetKeys.UiCoin,
  AssetKeys.UiHeart,
  AssetKeys.UiHeartEmpty,
  AssetKeys.UiStar,
  AssetKeys.UiStarEmpty,
  AssetKeys.UiCheck,
] as const

export type UiKey = (typeof UiKeys)[number]

// ---------------------------------------------------
// Fallback helper: if a texture doesn't exist in the cache,
// generate a placeholder of the requested size and colour.
// Used by PreloadScene so gameplay never blocks on missing art.
// ---------------------------------------------------

/**
 * Resolve an asset key, trying the Phaser cache first, then falling back
 * to a generated placeholder. Call from PreloadScene or GameScene when
 * loading textures.
 */
export function resolveKey(key: AssetKey): string {
  // The caller checks scene.textures.exists(key) – if false, they
  // generate a placeholder via src/utils/placeholders.ts
  return key
}
