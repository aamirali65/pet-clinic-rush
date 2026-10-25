import Phaser from 'phaser';
import { COMBO_MULTIPLIERS, MAX_HEARTS } from '@/config/constants';
import { SCENES } from '@/config/sceneKeys';
import { bus } from '@/contracts/events';
import { Button } from '@/ui/Button';
import { COLORS, CSS, FONT_FAMILY, textStyle } from '@/ui/theme';

export interface HudInit {
  levelId: number;
  target: number;
  timeLimit: number;
  coins: number;
  hearts: number;
  score: number;
}

export class HudScene extends Phaser.Scene {
  private levelId = 1;
  private target = 5;
  private coins = 0;
  private score = 0;
  private hearts = MAX_HEARTS;
  private seconds = 180;
  private cured = 0;
  private coinText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private goalText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private comboBadge!: Phaser.GameObjects.Container;
  private heartImages: Phaser.GameObjects.Image[] = [];
  private unsubscribers: Array<() => void> = [];
  private lowTimer = false;

  constructor() {
    super(SCENES.Hud);
  }

  init(data: Partial<HudInit>): void {
    this.levelId = data.levelId ?? 1;
    this.target = Math.max(1, data.target ?? 5);
    this.coins = data.coins ?? 0;
    this.score = data.score ?? 0;
    this.hearts = data.hearts ?? MAX_HEARTS;
    this.seconds = data.timeLimit ?? 180;
    this.cured = 0;
    this.lowTimer = false;
  }

  create(): void {
    this.drawBar();

    this.add
      .text(56, 36, `LV ${this.levelId}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        fontStyle: 'bold',
        color: CSS.white,
        backgroundColor: '#f79bb5',
        padding: { x: 13, y: 6 },
      })
      .setOrigin(0, 0.5);

    this.add.image(168, 38, 'ui-coin').setDisplaySize(36, 36);
    this.coinText = this.add
      .text(192, 38, '0', textStyle(28, CSS.ink))
      .setOrigin(0, 0.5);

    this.add.image(328, 38, 'ui-star').setDisplaySize(34, 34);
    this.scoreText = this.add
      .text(350, 38, '0', textStyle(28, CSS.ink))
      .setOrigin(0, 0.5);

    this.heartImages = [];
    for (let i = 0; i < MAX_HEARTS; i += 1) {
      this.heartImages.push(
        this.add.image(40 + i * 40, 91, 'ui-heart').setDisplaySize(34, 34),
      );
    }

    this.timerText = this.add
      .text(360, 91, this.formatTime(this.seconds), {
        fontFamily: FONT_FAMILY,
        fontSize: '27px',
        fontStyle: 'bold',
        color: CSS.ink,
      })
      .setOrigin(0.5);

    this.add.image(568, 92, 'paw').setTint(0x8ed6c4).setDisplaySize(26, 26);
    this.goalText = this.add
      .text(586, 92, `0/${this.target}`, textStyle(23, CSS.inkSoft))
      .setOrigin(0, 0.5);

    new Button(this, 668, 48, {
      label: '',
      width: 58,
      height: 58,
      radius: 20,
      color: COLORS.coral,
      icon: 'icon-pause',
      iconScale: 0.9,
      onClick: () => this.openPause(),
    });

    this.comboBadge = this.add.container(360, 174).setAlpha(0).setDepth(10);
    const comboBg = this.add.graphics();
    comboBg.fillStyle(COLORS.shadow, 0.18);
    comboBg.fillRoundedRect(-96, -25, 192, 54, 27);
    comboBg.fillStyle(COLORS.yellow, 1);
    comboBg.fillRoundedRect(-96, -29, 192, 54, 27);
    comboBg.fillStyle(0xffffff, 0.3);
    comboBg.fillRoundedRect(-80, -22, 160, 12, 6);
    this.comboText = this.add
      .text(0, 0, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        fontStyle: 'bold',
        color: CSS.ink,
      })
      .setOrigin(0.5);
    this.comboBadge.add([comboBg, this.comboText]);

    this.updateCoins(false);
    this.updateScore(false);
    this.updateHearts(false);
    this.updateGoal();
    this.updateTimer();

    const coinsOff = bus.on('coins:changed', ({ coins }) => {
      this.coins = coins;
      this.updateCoins(true);
    });
    const scoreOff = bus.on('score:changed', ({ score }) => {
      this.score = score;
      this.updateScore(true);
    });
    const heartsOff = bus.on('hearts:changed', ({ hearts }) => {
      this.hearts = hearts;
      this.updateHearts(true);
    });
    const comboOff = bus.on('combo:changed', ({ combo, reset }) => {
      if (reset || combo < 2) this.hideCombo();
      else this.showCombo(combo);
    });
    const timerOff = bus.on('timer:tick', ({ secondsRemaining }) => {
      this.seconds = secondsRemaining;
      this.updateTimer();
    });
    const curedOff = bus.on('pet:cured', () => {
      this.cured += 1;
      this.updateGoal();
    });
    this.unsubscribers = [coinsOff, scoreOff, heartsOff, comboOff, timerOff, curedOff];

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  private drawBar(): void {
    const g = this.add.graphics();
    g.fillStyle(COLORS.shadow, 0.12);
    g.fillRoundedRect(0, -20, 720, 142, 30);
    g.fillStyle(0xfffdf9, 0.97);
    g.fillRoundedRect(0, -20, 720, 136, 30);
    g.fillStyle(COLORS.mint, 0.9);
    g.fillRoundedRect(0, 96, 720, 20, 0);
    g.fillStyle(0xffffff, 0.4);
    g.fillRoundedRect(16, 104, 688, 6, 3);
  }

  private updateCoins(animate: boolean): void {
    this.coinText.setText(String(this.coins));
    if (!animate) return;
    this.tweens.add({
      targets: this.coinText,
      scale: 1.18,
      duration: 110,
      yoyo: true,
    });
  }

  private updateScore(animate: boolean): void {
    this.scoreText.setText(String(this.score));
    if (!animate) return;
    this.tweens.add({
      targets: this.scoreText,
      scale: 1.18,
      duration: 110,
      yoyo: true,
    });
  }

  private updateHearts(animate: boolean): void {
    this.heartImages.forEach((heart, index) => {
      const full = index < this.hearts;
      const texture = full ? 'ui-heart' : 'ui-heart-empty';
      if (heart.texture.key !== texture) heart.setTexture(texture);
      if (animate && !full) {
        this.tweens.add({
          targets: heart,
          x: heart.x + 5,
          angle: -12,
          duration: 70,
          yoyo: true,
          repeat: 2,
          onComplete: () => heart.setAngle(0),
        });
      }
    });
  }

  private updateGoal(): void {
    this.goalText.setText(`${Math.min(this.target, this.cured)}/${this.target}`);
  }

  private updateTimer(): void {
    this.seconds = Math.max(0, this.seconds);
    this.timerText.setText(this.formatTime(this.seconds));
    const low = this.seconds <= 10;
    this.timerText.setColor(low ? CSS.red : CSS.ink);
    if (low && !this.lowTimer) {
      this.lowTimer = true;
      this.tweens.add({
        targets: this.timerText,
        scale: 1.12,
        duration: 260,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private showCombo(combo: number): void {
    const multiplier = COMBO_MULTIPLIERS[Math.min(combo, COMBO_MULTIPLIERS.length - 1)] ?? 1;
    this.comboText.setText(`x${multiplier} COMBO!`);
    this.tweens.killTweensOf(this.comboBadge);
    this.comboBadge.setAlpha(1).setScale(0.7).setY(174);
    this.tweens.add({
      targets: this.comboBadge,
      scale: 1,
      y: 164,
      duration: 260,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: this.comboBadge,
      alpha: 0,
      delay: 900,
      duration: 220,
    });
  }

  private hideCombo(): void {
    this.tweens.killTweensOf(this.comboBadge);
    this.tweens.add({ targets: this.comboBadge, alpha: 0, duration: 160 });
  }

  private openPause(): void {
    if (this.scene.isActive(SCENES.Pause)) return;
    // The HUD stays alive under Settings/Tutorial; never open a second pause
    // layer (or unpause-equivalent) while Game is already paused or gone.
    if (!this.scene.isActive(SCENES.Game) || this.scene.isPaused(SCENES.Game)) return;
    this.scene.pause(SCENES.Game);
    this.scene.launch(SCENES.Pause, { auto: false });
  }

  private formatTime(seconds: number): string {
    const value = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(value / 60);
    const rest = value % 60;
    return `${minutes}:${rest.toString().padStart(2, '0')}`;
  }

  private shutdown(): void {
    this.unsubscribers.forEach((off) => off());
    this.unsubscribers = [];
  }
}


