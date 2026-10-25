export const SCENES = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  Menu: 'MenuScene',
  LevelSelect: 'LevelSelectScene',
  Game: 'GameScene',
  Hud: 'HudScene',
  Pause: 'PauseScene',
  Result: 'ResultScene',
  Shop: 'ShopScene',
  Settings: 'SettingsScene',
  Tutorial: 'TutorialScene',
} as const;

export type SceneKey = (typeof SCENES)[keyof typeof SCENES];
