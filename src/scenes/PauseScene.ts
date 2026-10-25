import Phaser from 'phaser';
import { SCENES } from '@/config/sceneKeys';
import { audio } from '@/services/AudioManager';
import { save } from '@/services/SaveService';
import { Button } from '@/ui/Button';
import { Panel } from '@/ui/Panel';
import { COLORS, CSS, FONT_FAMILY } from '@/ui/theme';

export class PauseScene extends Phaser.Scene {
  private auto = false;

  constructor() {
    super(SCENES.Pause);
  }

  init(data: { auto?: boolean }): void {
    this.auto = data.auto === true;
  }

  create(): void {
    if (!this.scene.isPaused(SCENES.Game)) this.scene.pause(SCENES.Game);
    this.add.rectangle(360, 640, 720, 1280, 0x2c2233, 0.62).setInteractive();

    const panel = new Panel(this, 360, 650, 580, 780, {
      color: COLORS.panel,
      radius: 44,
      border: COLORS.lilac,
    });
    panel.setScale(0.86);
    this.tweens.add({
      targets: panel,
      scale: 1,
      duration: 280,
      ease: 'Back.easeOut',
    });

    this.add
      .text(360, 412, this.auto ? 'TAKING A BREAK' : 'PAUSED', {
        fontFamily: FONT_FAMILY,
        fontSize: '48px',
        fontStyle: 'bold',
        color: CSS.ink,
      })
      .setOrigin(0.5);
    this.add
      .text(
        360,
        468,
        this.auto ? 'Your patients will wait right here.' : 'The clinic is on a tiny coffee break.',
        {
          fontFamily: FONT_FAMILY,
          fontSize: '20px',
          color: CSS.inkSoft,
        },
      )
      .setOrigin(0.5);

    const pet = this.add.image(360, 590, 'pet-cat-sick').setScale(0.9);
    this.tweens.add({
      targets: pet,
      y: 578,
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: 'Sine.easeInOut',
    });

    new Button(this, 360, 742, {
      label: 'RESUME',
      width: 400,
      height: 94,
      color: COLORS.mint,
      icon: 'icon-play',
      iconScale: 0.75,
      fontSize: 32,
      onClick: () => this.resume(),
    });

    new Button(this, 360, 856, {
      label: 'SETTINGS',
      width: 400,
      height: 82,
      color: COLORS.lilac,
      icon: 'icon-gear',
      iconScale: 0.7,
      fontSize: 27,
      onClick: () => {
        audio.play('tap', 0.4);
        this.scene.start(SCENES.Settings, { fromPause: true });
      },
    });

    new Button(this, 360, 948, {
      label: 'QUIT TO MENU',
      width: 400,
      height: 78,
      color: COLORS.coral,
      icon: 'icon-home',
      iconScale: 0.65,
      fontSize: 24,
      onClick: () => this.quit(),
    });

    this.add
      .text(360, 1008, this.auto ? 'Tap RESUME when you are ready.' : 'Tip: a paused clinic is a calm clinic.', {
        fontFamily: FONT_FAMILY,
        fontSize: '17px',
        color: CSS.inkSoft,
      })
      .setOrigin(0.5)
      .setAlpha(0.7);

    audio.bind(this);
    const settings = save.getSettings();
    audio.setSettings(settings.musicEnabled, settings.sfxEnabled);
  }

  private resume(): void {
    audio.play('tap', 0.4);
    this.scene.resume(SCENES.Game);
    this.scene.stop();
  }

  private quit(): void {
    audio.play('tap', 0.4);
    this.scene.stop(SCENES.Game);
    this.scene.stop(SCENES.Hud);
    this.scene.start(SCENES.Menu);
  }
}
