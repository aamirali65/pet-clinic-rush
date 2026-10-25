import Phaser from 'phaser';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 720,
  height: 1280,
  backgroundColor: '#f6e2ca',
  transparent: false,
  antialias: true,
  roundPixels: false,
  pixelArt: false,
  banner: false,
  scene: [],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 720,
    height: 1280,
  },
  input: {
    activePointers: 3,
    touch: { capture: true },
  },
  audio: {
    disableWebAudio: false,
    noAudio: false,
  },
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
  render: {
    powerPreference: 'high-performance',
    batchSize: 4096,
  },
};
