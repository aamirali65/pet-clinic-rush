import Phaser from 'phaser';
import { SCENES } from '@/config/sceneKeys';
import { save } from '@/services/SaveService';
import { CSS, FONT_FAMILY, loadGameFont } from '@/ui/theme';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Boot);
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#fff3e0');
    const paw = this.add.container(360, 500);
    const shadow = this.add.circle(0, 10, 82, 0x69bda9, 0.45);
    const circle = this.add.circle(0, 0, 78, 0x8ed6c4);
    const toes = [
      this.add.circle(-46, -44, 19, 0xfff8ee),
      this.add.circle(-16, -58, 20, 0xfff8ee),
      this.add.circle(18, -58, 20, 0xfff8ee),
      this.add.circle(46, -42, 19, 0xfff8ee),
      this.add.ellipse(0, 8, 74, 62, 0xfff8ee),
    ];
    paw.add([shadow, circle, ...toes]);
    paw.setScale(0);
    this.tweens.add({
      targets: paw,
      scale: 1,
      duration: 650,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: paw,
      y: 486,
      angle: -5,
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: 'Sine.easeInOut',
    });

    this.add
      .text(360, 650, 'PET CLINIC', {
        fontFamily: FONT_FAMILY,
        fontSize: '58px',
        fontStyle: 'bold',
        color: CSS.ink,
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    this.add
      .text(360, 720, 'RUSH', {
        fontFamily: FONT_FAMILY,
        fontSize: '42px',
        fontStyle: 'bold',
        color: CSS.pink,
        letterSpacing: 8,
      })
      .setOrigin(0.5);
    const barWidth = 280;
    const bar = this.add.graphics();
    bar.fillStyle(0x4a3b53, 0.12);
    bar.fillRoundedRect(220, 800, barWidth, 16, 8);
    const fill = this.add.graphics();
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 900,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        const value = tween.getValue() ?? 0;
        fill.clear();
        fill.fillStyle(0x8ed6c4, 1);
        fill.fillRoundedRect(220, 800, Math.max(16, barWidth * value), 16, 8);
      },
    });

    this.add
      .text(360, 856, 'Opening the clinic...', {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#d9778e',
        letterSpacing: 1,
      })
      .setOrigin(0.5);

    void this.startGame();
  }

  private async startGame(): Promise<void> {
    await Promise.all([loadGameFont(), save.load()]);
    this.time.delayedCall(650, () => {
      window.dispatchEvent(new Event('game-ready'));
      this.scene.start(SCENES.Preload);
    });
  }
}

