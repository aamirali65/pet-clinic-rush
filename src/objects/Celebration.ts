import Phaser from 'phaser';
import { audio } from '@/services/AudioManager';
import { COLORS, CSS, DEPTH, FONT_FAMILY } from '@/ui/theme';

export interface CelebrationData {
  stars: number;
  curedPets: number;
  coinsEarned: number;
}

const PALETTE = [COLORS.pink, COLORS.mint, COLORS.yellow, COLORS.blue, COLORS.lilac, COLORS.coral];

/** Generated once per game and reused by every celebration. */
function ensureTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('fx-ribbon')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(0, 0, 46, 18, 5);
    g.fillStyle(0x000000, 0.12);
    g.fillRoundedRect(0, 12, 46, 6, 3);
    g.generateTexture('fx-ribbon', 46, 18);
    g.destroy();
  }
  if (!scene.textures.exists('fx-flash')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    for (let i = 8; i >= 1; i -= 1) {
      g.fillStyle(0xffffff, 0.03 + (9 - i) * 0.012);
      g.fillCircle(64, 64, (64 / 8) * i);
    }
    g.generateTexture('fx-flash', 128, 128);
    g.destroy();
  }
}

/**
 * Ribbon cannons, firework bursts and a "LEVEL COMPLETE" banner, all drawn in
 * the gameplay scene. Everything is tween-driven and destroys itself, so the
 * scene can shut down while the celebration is still running.
 */
export class Celebration extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, data: CelebrationData) {
    super(scene, 0, 0);
    ensureTextures(scene);
    this.setDepth(DEPTH.modal + 20);
    scene.add.existing(this);

    this.launchRibbons(0, -1);
    this.launchRibbons(720, 1);
    this.dropRibbons();
    this.time.delayedCall(140, () => this.firework(180, 420));
    this.time.delayedCall(420, () => this.firework(540, 360));
    this.time.delayedCall(700, () => this.firework(360, 560));
    this.time.delayedCall(180, () => this.showBanner(data));
  }

  private get time(): Phaser.Time.Clock {
    return this.scene.time;
  }

  /** Ribbon cannon: a burst that arcs up and inwards before raining down. */
  private launchRibbons(originX: number, direction: 1 | -1): void {
    for (let i = 0; i < 11; i += 1) {
      const delay = Phaser.Math.Between(0, 260);
      const bit = this.scene.add
        .image(originX, 1260, 'fx-ribbon')
        .setDepth(this.depth + 1)
        .setTint(Phaser.Utils.Array.GetRandom(PALETTE))
        .setScale(Phaser.Math.FloatBetween(0.6, 1.05))
        .setAngle(direction * Phaser.Math.Between(10, 60));

      const apexX = originX + direction * Phaser.Math.Between(150, 330);
      const apexY = Phaser.Math.Between(260, 720);
      const apexAngle = bit.angle + Phaser.Math.Between(-260, 260);

      this.scene.tweens.add({
        targets: bit,
        x: apexX,
        y: apexY,
        angle: apexAngle,
        duration: Phaser.Math.Between(380, 560),
        delay,
        ease: 'Quad.easeOut',
        onComplete: () => {
          if (!bit.scene) return;
          this.scene.tweens.add({
            targets: bit,
            x: apexX + Phaser.Math.Between(-60, 60),
            y: 1340,
            angle: apexAngle + Phaser.Math.Between(-180, 180),
            alpha: 0.25,
            duration: Phaser.Math.Between(850, 1350),
            ease: 'Quad.easeIn',
            onComplete: () => bit.destroy(),
          });
        },
      });
    }
  }

  /** A slow curtain of ribbons from the ceiling so the screen stays busy. */
  private dropRibbons(): void {
    for (let i = 0; i < 14; i += 1) {
      const bit = this.scene.add
        .image(Phaser.Math.Between(40, 680), Phaser.Math.Between(-120, 40), 'fx-ribbon')
        .setDepth(this.depth + 1)
        .setTint(Phaser.Utils.Array.GetRandom(PALETTE))
        .setScale(Phaser.Math.FloatBetween(0.5, 0.9))
        .setAngle(Phaser.Math.Between(-40, 40));

      this.scene.tweens.add({
        targets: bit,
        y: 1340,
        x: bit.x + Phaser.Math.Between(-80, 80),
        angle: bit.angle + Phaser.Math.Between(-300, 300),
        duration: Phaser.Math.Between(1500, 2300),
        delay: Phaser.Math.Between(0, 500),
        ease: 'Sine.easeIn',
        onComplete: () => bit.destroy(),
      });
    }
  }

  private firework(x: number, y: number): void {
    const flash = this.scene.add
      .image(x, y, 'fx-flash')
      .setDepth(this.depth + 1)
      .setTint(Phaser.Utils.Array.GetRandom(PALETTE))
      .setScale(0.4)
      .setAlpha(0.85);
    this.scene.tweens.add({
      targets: flash,
      scale: 1.7,
      alpha: 0,
      duration: 420,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });

    const color = Phaser.Utils.Array.GetRandom(PALETTE);
    for (let i = 0; i < 14; i += 1) {
      const angle = (Math.PI * 2 * i) / 14 + Phaser.Math.FloatBetween(-0.12, 0.12);
      const distance = Phaser.Math.Between(70, 130);
      const spark = this.scene.add
        .image(x, y, 'fx-sparkle')
        .setDepth(this.depth + 2)
        .setTint(i % 3 === 0 ? COLORS.yellow : color)
        .setScale(Phaser.Math.FloatBetween(0.45, 0.8));
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        scale: 0.15,
        delay: Phaser.Math.Between(0, 60),
        duration: Phaser.Math.Between(480, 720),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
    audio.play('sparkle', 0.4);
  }

  private showBanner(data: CelebrationData): void {
    const banner = this.scene.add.container(360, 470).setDepth(this.depth + 3);
    this.add(banner);

    const shadow = this.scene.add.ellipse(0, 128, 520, 44, COLORS.shadow, 0.18);

    const tails = this.scene.add.graphics();
    tails.fillStyle(COLORS.mint, 1);
    tails.fillTriangle(-250, 10, -330, 34, -250, 58);
    tails.fillStyle(COLORS.coral, 1);
    tails.fillTriangle(250, 10, 330, 34, 250, 58);

    const card = this.scene.add.graphics();
    card.fillStyle(COLORS.paper, 1);
    card.fillRoundedRect(-270, -120, 540, 240, 36);
    card.lineStyle(6, COLORS.pinkLight, 1);
    card.strokeRoundedRect(-270, -120, 540, 240, 36);
    card.fillStyle(COLORS.pink, 1);
    card.fillRoundedRect(-270, -120, 540, 34, { tl: 36, tr: 36, bl: 0, br: 0 });

    const title = this.scene.add
      .text(0, -46, 'LEVEL COMPLETE', {
        fontFamily: FONT_FAMILY,
        fontSize: '50px',
        fontStyle: 'bold',
        color: CSS.ink,
      })
      .setOrigin(0.5);
    title.setShadow(0, 3, 'rgba(74,59,83,0.16)', 0, true, true);

    const stars = this.scene.add.container(0, 22);
    for (let i = 0; i < 3; i += 1) {
      const earned = i < data.stars;
      const star = this.scene.add
        .image((i - 1) * 58, 0, 'ui-star')
        .setScale(0.001)
        .setTint(earned ? COLORS.yellow : 0xd9cdd9)
        .setAlpha(earned ? 1 : 0.8);
      stars.add(star);
      this.scene.tweens.add({
        targets: star,
        scale: earned ? 0.72 : 0.6,
        delay: 260 + i * 110,
        duration: 340,
        ease: 'Back.easeOut',
      });
      if (earned) {
        this.scene.tweens.add({
          targets: star,
          angle: { from: -14, to: 0 },
          delay: 260 + i * 110,
          duration: 380,
          ease: 'Back.easeOut',
        });
      }
    }

    const subtitle = this.scene.add
      .text(0, 74, `${data.curedPets} pets cured  ·  +${data.coinsEarned} coins`, {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        color: CSS.inkSoft,
        align: 'center',
      })
      .setOrigin(0.5);
    subtitle.setAlpha(0);
    this.scene.tweens.add({ targets: subtitle, alpha: 1, delay: 420, duration: 260 });

    banner.add([shadow, tails, card, title, stars, subtitle]);
    banner.setScale(0.55).setAlpha(0);
    this.scene.tweens.add({
      targets: banner,
      scale: 1,
      alpha: 1,
      duration: 420,
      ease: 'Back.easeOut',
      onComplete: () => {
        audio.play('star', 0.5);
        this.scene.tweens.add({
          targets: banner,
          y: banner.y - 8,
          duration: 620,
          yoyo: true,
          repeat: 1,
          ease: 'Sine.easeInOut',
        });
      },
    });
  }

  /** Fade the whole celebration out before the result screen takes over. */
  dismiss(duration = 260): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration,
      onComplete: () => this.destroy(),
    });
  }
}
