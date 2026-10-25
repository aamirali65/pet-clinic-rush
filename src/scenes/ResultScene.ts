import Phaser from 'phaser';
import { LEVEL_COUNT, LEVEL_TITLES } from '@/config/levels';
import { SCENES } from '@/config/sceneKeys';
import type { ResultSceneData } from '@/contracts/types';
import { audio } from '@/services/AudioManager';
import { haptics } from '@/services/HapticsService';
import { save } from '@/services/SaveService';
import { Button } from '@/ui/Button';
import { Panel } from '@/ui/Panel';
import { StarsRow } from '@/ui/StarsRow';
import { COLORS, CSS, FONT_FAMILY, textStyle } from '@/ui/theme';

export class ResultScene extends Phaser.Scene {
  private payload!: ResultSceneData;
  private coinLabel!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.Result);
  }

  init(data: ResultSceneData): void {
    this.payload = data;
  }

  create(): void {
    const { result } = this.payload;
    const levelId = this.payload.levelId ?? result.levelId ?? save.getUnlockedLevel();
    this.cameras.main.fadeIn(220, 44, 30, 53);
    this.add.image(360, 640, 'bg-clinic').setDepth(0);
    this.add.rectangle(360, 640, 720, 1280, 0x2c2233, 0.58).setDepth(1);

    const previousBest = save.getLevelBestScore(levelId);
    if (result.success) {
      save.completeLevel({
        levelId,
        stars: result.starRating,
        score: result.finalScore,
        coinsEarned: result.coinsEarned,
      });
    } else {
      save.addCoins(result.coinsEarned);
    }
    void save.flush();

    const panelHeight = 840;
    const panel = new Panel(this, 360, 650, 620, panelHeight, {
      color: COLORS.panel,
      radius: 44,
      border: result.success ? COLORS.mint : COLORS.coral,
    });
    panel.setDepth(5);

    const heading = result.success ? 'LEVEL COMPLETE!' : 'TRY AGAIN!';
    const headingColor = result.success ? CSS.green : CSS.coral;
    this.add
      .text(360, 318, heading, {
        fontFamily: FONT_FAMILY,
        fontSize: '44px',
        fontStyle: 'bold',
        color: headingColor,
        stroke: '#ffffff',
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setDepth(8);
    this.add
      .text(360, 368, `Level ${levelId} · ${LEVEL_TITLES[levelId - 1] ?? 'Clinic'}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        color: CSS.inkSoft,
      })
      .setOrigin(0.5)
      .setDepth(8);

    if (result.success) {
      const stars = new StarsRow(this, 360, 448, 84, 18);
      stars.setDepth(9);
      stars.setStars(0, false);
      this.time.delayedCall(320, () => {
        stars.setStars(result.starRating, true);
        for (let i = 0; i < result.starRating; i += 1) {
          this.time.delayedCall(380 + i * 180, () => {
            audio.play('star', 0.55);
            haptics.light();
          });
        }
      });
      this.confetti();
    } else {
      this.add.image(360, 452, 'pet-dog-sick').setDisplaySize(120, 120).setDepth(9);
      this.add
        .text(360, 530, 'Your patients still need you!', {
          fontFamily: FONT_FAMILY,
          fontSize: '21px',
          color: CSS.inkSoft,
        })
        .setOrigin(0.5)
        .setDepth(8);
    }

    this.drawStatRow(592, 'CURED PETS', String(result.curedPets));
    this.drawStatRow(656, 'SCORE', String(result.finalScore));
    if (result.success && result.finalScore > previousBest) {
      this.add
        .text(520, 656, 'NEW BEST!', {
          fontFamily: FONT_FAMILY,
          fontSize: '16px',
          fontStyle: 'bold',
          color: CSS.coral,
          backgroundColor: '#ffe7dc',
          padding: { x: 8, y: 4 },
        })
        .setOrigin(0, 0.5)
        .setDepth(9);
    }

    this.add.image(316, 724, 'ui-coin').setDisplaySize(38, 38).setDepth(8);
    this.coinLabel = this.add
      .text(344, 724, '0', textStyle(32, CSS.ink))
      .setOrigin(0, 0.5)
      .setDepth(8);
    this.add
      .text(360, 766, result.success ? 'Added to your piggy bank' : 'Coins earned still count', {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: CSS.inkSoft,
      })
      .setOrigin(0.5)
      .setDepth(8);
    this.tweens.addCounter({
      from: 0,
      to: result.coinsEarned,
      duration: 650,
      delay: 350,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => {
        this.coinLabel?.setText(String(Math.round(tween.getValue() ?? 0)));
      },
      onComplete: () => {
        this.coinLabel?.setText(String(result.coinsEarned));
        audio.play('coin', 0.5);
      },
    });

    const hasNext = result.success && levelId < LEVEL_COUNT;

    // Show Try Again button for failed levels, otherwise Next Level / Back to Menu
    const tryAgain = new Button(this, 360, 846, {
      label: result.success ? (hasNext ? 'NEXT LEVEL' : 'BACK TO MENU') : 'TRY AGAIN',
      width: 470,
      height: 96,
      color: result.success ? COLORS.mint : COLORS.coral,
      icon: result.success ? (hasNext ? 'icon-arrow-right' : 'icon-home') : 'icon-play',
      iconScale: 0.7,
      fontSize: 29,
      onClick: () => {
        if (result.success) {
          if (hasNext) this.startLevel(levelId + 1);
          else this.goMenu();
        } else {
          this.startLevel(levelId);
        }
      },
    });
    tryAgain.setDepth(9);

    const replay = new Button(this, 206, 964, {
      label: 'REPLAY',
      width: 214,
      height: 74,
      color: COLORS.blue,
      fontSize: 23,
      onClick: () => this.startLevel(levelId),
    });
    const menu = new Button(this, 514, 964, {
      label: 'MENU',
      width: 214,
      height: 74,
      color: COLORS.lilac,
      fontSize: 23,
      onClick: () => this.goMenu(),
    });
    replay.setDepth(9);
    menu.setDepth(9);

    audio.bind(this);
    const settings = save.getSettings();
    audio.setSettings(settings.musicEnabled, settings.sfxEnabled);
    audio.play(result.success ? 'level-complete' : 'game-over', 0.6);
    this.input.once('pointerdown', () => audio.unlock());
  }

  private drawStatRow(yPos: number, label: string, value: string): void {
    this.add
      .text(240, yPos, label, textStyle(18, CSS.inkSoft))
      .setOrigin(0, 0.5)
      .setDepth(8);
    this.add
      .text(500, yPos, value, textStyle(30, CSS.ink))
      .setOrigin(1, 0.5)
      .setDepth(8);
    const line = this.add.graphics().setDepth(7);
    line.lineStyle(2, COLORS.ink, 0.08);
    line.beginPath();
    line.moveTo(230, yPos + 26);
    line.lineTo(510, yPos + 26);
    line.strokePath();
  }

  private confetti(): void {
    const colors = [0xf79bb5, 0x8ed6c4, 0xffd166, 0x9ed3f2, 0xc9b6f2];
    for (let i = 0; i < 40; i += 1) {
      const bit = this.add
        .image(Phaser.Math.Between(20, 700), Phaser.Math.Between(-60, 100), 'fx-confetti')
        .setDepth(10)
        .setTint(Phaser.Utils.Array.GetRandom(colors));
      this.tweens.add({
        targets: bit,
        y: 1340,
        x: bit.x + Phaser.Math.Between(-100, 100),
        angle: Phaser.Math.Between(-360, 360),
        duration: Phaser.Math.Between(1600, 3000),
        delay: Phaser.Math.Between(0, 700),
        ease: 'Sine.easeIn',
        onComplete: () => bit.destroy(),
      });
    }
  }

  private startLevel(levelId: number): void {
    audio.play('tap', 0.4);
    this.cameras.main.fadeOut(160, 44, 30, 53);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENES.Game, { levelId });
    });
  }

  private goMenu(): void {
    audio.play('tap', 0.4);
    this.cameras.main.fadeOut(160, 44, 30, 53);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENES.Menu);
    });
  }
}


