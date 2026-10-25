import Phaser from 'phaser';
import { SCENES } from '@/config/sceneKeys';
import { CSS, FONT_FAMILY } from '@/ui/theme';
import { generatePlaceholderTextures } from '@/utils/placeholders';

const SFX: Array<[string, string]> = [
  ['sfx-tap', 'tap.ogg'],
  ['sfx-pick', 'pick.ogg'],
  ['sfx-place', 'place.ogg'],
  ['sfx-wrong', 'wrong.ogg'],
  ['sfx-cure', 'cure.ogg'],
  ['sfx-coin', 'coin.ogg'],
  ['sfx-level-start', 'level-start.ogg'],
  ['sfx-scratch', 'scratch.ogg'],
  ['sfx-tick', 'tick.ogg'],
  ['sfx-open', 'open.ogg'],
  ['sfx-close', 'close.ogg'],
  ['sfx-pop', 'pop.ogg'],
  ['sfx-sparkle', 'sparkle.ogg'],
  ['sfx-swipe', 'swipe.ogg'],
  ['sfx-hold', 'hold.ogg'],
  ['sfx-star', 'star.ogg'],
  ['sfx-heart-lost', 'heart-lost.ogg'],
  ['sfx-bad', 'bad.ogg'],
];

const UI_ICONS: Array<[string, string]> = [
  ['icon-pause', 'pause.png'],
  ['icon-play', 'next.png'],
  ['icon-gear', 'gear.png'],
  ['icon-home', 'home.png'],
  ['icon-check', 'checkmark.png'],
  ['icon-lock', 'locked.png'],
  ['icon-star', 'star.png'],
  ['icon-arrow-left', 'arrowLeft.png'],
  ['icon-arrow-right', 'arrowRight.png'],
  ['icon-music-on', 'musicOn.png'],
  ['icon-music-off', 'musicOff.png'],
  ['icon-sound-on', 'audioOn.png'],
  ['icon-sound-off', 'audioOff.png'],
  ['icon-trophy', 'trophy.png'],
  ['icon-medal', 'medal1.png'],
  ['icon-question', 'question.png'],
];

export class PreloadScene extends Phaser.Scene {
  private barFill!: Phaser.GameObjects.Graphics;
  private progressText!: Phaser.GameObjects.Text;
  private displayed = 0;
  private target = 0;

  constructor() {
    super(SCENES.Preload);
  }

  preload(): void {
    this.cameras.main.setBackgroundColor('#fff3e0');
    this.add
      .text(360, 470, 'Setting up the clinic', {
        fontFamily: FONT_FAMILY,
        fontSize: '38px',
        fontStyle: 'bold',
        color: CSS.ink,
      })
      .setOrigin(0.5);
    this.progressText = this.add
      .text(360, 610, 'Warming up the stethoscope...', {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        color: '#7c6b86',
      })
      .setOrigin(0.5);

    const bar = this.add.graphics();
    bar.fillStyle(0x4a3b53, 0.12);
    bar.fillRoundedRect(160, 540, 400, 22, 11);
    this.barFill = this.add.graphics();

    const paw = this.add.container(360, 360);
    paw.add([
      this.add.circle(0, 10, 58, 0x69bda9, 0.4),
      this.add.circle(0, 0, 54, 0x8ed6c4),
      this.add.circle(-34, -32, 14, 0xfff8ee),
      this.add.circle(-12, -42, 14, 0xfff8ee),
      this.add.circle(12, -42, 14, 0xfff8ee),
      this.add.circle(34, -32, 14, 0xfff8ee),
      this.add.ellipse(0, 6, 52, 44, 0xfff8ee),
    ]);
    paw.setScale(1.7);
    this.tweens.add({
      targets: paw,
      angle: 8,
      yoyo: true,
      repeat: -1,
      duration: 550,
      ease: 'Sine.easeInOut',
    });

    this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => {
      this.target = value;
    });
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`Optional asset failed to load: ${file.src}`);
    });

    for (const [key, file] of SFX) {
      this.load.audio(key, `assets/audio/sfx/${file}`);
    }
    for (const [key, file] of UI_ICONS) {
      this.load.image(key, `assets/images/ui/${file}`);
    }
    this.load.image('fx-sparkle', 'assets/images/particles/sparkle.png');
    this.load.image('fx-dot', 'assets/images/particles/dot.png');
    this.load.image('fx-confetti', 'assets/images/particles/confetti.png');
    for (const pet of ['dog', 'rabbit', 'bird', 'hamster']) {
      this.load.image(`portrait-${pet}`, `assets/images/pets/${pet}.png`);
    }
  }

  create(): void {
    generatePlaceholderTextures(this);
    this.target = 1;
    this.displayed = 0;
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 550,
      ease: 'Sine.easeOut',
      onUpdate: (tween) => {
        this.displayed = tween.getValue() ?? 0;
        this.drawBar(this.displayed);
      },
    });
    this.progressText.setText('All paws on deck!');
    this.time.delayedCall(750, () => {
      this.scene.start(SCENES.Menu);
    });
  }

  update(): void {
    if (this.target > this.displayed + 0.02) {
      this.displayed += (this.target - this.displayed) * 0.18;
      this.drawBar(this.displayed);
    }
  }

  private drawBar(value: number): void {
    this.barFill.clear();
    this.barFill.fillStyle(0x8ed6c4, 1);
    this.barFill.fillRoundedRect(160, 540, Math.max(22, 400 * value), 22, 11);
    this.barFill.fillStyle(0xffffff, 0.35);
    this.barFill.fillRoundedRect(172, 546, Math.max(6, 376 * value), 6, 3);
  }
}

