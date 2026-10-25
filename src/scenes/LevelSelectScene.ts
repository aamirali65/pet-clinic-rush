import Phaser from 'phaser';
import { LEVEL_COUNT, LEVEL_TITLES } from '@/config/levels';
import { SCENES } from '@/config/sceneKeys';
import { save } from '@/services/SaveService';
import { audio } from '@/services/AudioManager';
import { haptics } from '@/services/HapticsService';
import { Button } from '@/ui/Button';
import { COLORS, CSS, FONT_FAMILY, textStyle } from '@/ui/theme';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENES.LevelSelect);
  }

  create(): void {
    this.cameras.main.fadeIn(220, 255, 243, 224);
    this.add.image(360, 640, 'bg-clinic').setDepth(0);
    this.add.rectangle(360, 640, 720, 1280, 0xfff8ee, 0.35).setDepth(1);
    this.drawHeader();
    this.drawGrid();
  }

  private drawHeader(): void {
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(0xfffdf9, 0.97);
    g.fillRoundedRect(0, -20, 720, 180, 34);
    g.fillStyle(COLORS.mint, 0.9);
    g.fillRoundedRect(0, 130, 720, 16, 0);

    new Button(this, 62, 58, {
      label: '',
      width: 62,
      height: 62,
      radius: 22,
      color: COLORS.lilac,
      icon: 'icon-arrow-left',
      iconScale: 0.8,
      onClick: () => this.go(SCENES.Menu),
    }).setDepth(7);

    this.add
      .text(360, 54, 'CHOOSE A LEVEL', {
        fontFamily: FONT_FAMILY,
        fontSize: '38px',
        fontStyle: 'bold',
        color: CSS.ink,
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.add.image(568, 114, 'ui-star').setDisplaySize(30, 30).setDepth(6);
    this.add
      .text(588, 114, `${save.getTotalStars()}/${LEVEL_COUNT * 3}`, textStyle(21, CSS.inkSoft))
      .setOrigin(0, 0.5)
      .setDepth(6);
    this.add.image(168, 114, 'ui-coin').setDisplaySize(28, 28).setDepth(6);
    this.add
      .text(186, 114, String(save.getCoins()), textStyle(21, CSS.inkSoft))
      .setOrigin(0, 0.5)
      .setDepth(6);
  }

  private drawGrid(): void {
    const unlocked = save.getUnlockedLevel();
    const width = 140;
    const height = 158;
    const gapX = 14;
    const gapY = 12;
    const left = (720 - (width * 4 + gapX * 3)) / 2;
    const top = 284;

    for (let index = 0; index < LEVEL_COUNT; index += 1) {
      const id = index + 1;
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = left + width / 2 + col * (width + gapX);
      const y = top + height / 2 + row * (height + gapY);
      const isUnlocked = id <= unlocked;
      const isCurrent = id === unlocked && save.getLevelStars(id) === 0;
      const stars = save.getLevelStars(id);
      const card = this.add.container(x, y).setDepth(4);
      const bg = this.add.graphics();
      const base = !isUnlocked
        ? 0xeee2d6
        : stars > 0
          ? COLORS.mint
          : isCurrent
            ? COLORS.pink
            : COLORS.paper;
      bg.fillStyle(COLORS.shadow, 0.15);
      bg.fillRoundedRect(-width / 2, -height / 2 + 8, width, height, 24);
      bg.fillStyle(base === COLORS.paper ? 0xffffff : base, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 24);
      bg.fillStyle(0xffffff, 0.3);
      bg.fillRoundedRect(-width / 2 + 12, -height / 2 + 10, width - 24, 12, 6);
      card.add(bg);

      const small = this.add
        .text(0, -52, 'LEVEL', {
          fontFamily: FONT_FAMILY,
          fontSize: '15px',
          fontStyle: 'bold',
          color: isUnlocked ? CSS.inkSoft : '#aa9a90',
          letterSpacing: 1,
        })
        .setOrigin(0.5);
      const number = this.add
        .text(0, -14, String(id), {
          fontFamily: FONT_FAMILY,
          fontSize: '52px',
          fontStyle: 'bold',
          color: isUnlocked ? CSS.ink : '#b3a59c',
        })
        .setOrigin(0.5);
      card.add([small, number]);

      if (isUnlocked) {
        const title = this.add
          .text(0, 34, LEVEL_TITLES[index] ?? 'Clinic', {
            fontFamily: FONT_FAMILY,
            fontSize: '13px',
            fontStyle: 'bold',
            color: CSS.inkSoft,
            wordWrap: { width: 118 },
            align: 'center',
          })
          .setOrigin(0.5, 0);
        title.setY(30);
        card.add(title);
        for (let star = 0; star < 3; star += 1) {
          card.add(
            this.add
              .image((star - 1) * 28, 66, star < stars ? 'ui-star' : 'ui-star-empty')
              .setDisplaySize(24, 24),
          );
        }
      } else {
        const lock = this.add.image(0, 12, 'icon-lock').setDisplaySize(52, 52);
        card.add(lock);
        card.add(
          this.add
            .text(0, 56, 'LOCKED', {
              fontFamily: FONT_FAMILY,
              fontSize: '14px',
              fontStyle: 'bold',
              color: '#aa9a90',
            })
            .setOrigin(0.5),
        );
      }

      card.setSize(width, height);
      card.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, width, height),
        Phaser.Geom.Rectangle.Contains,
      );
      card.input!.cursor = isUnlocked ? 'pointer' : 'default';
      card.on('pointerdown', () => {
        this.tweens.add({ targets: card, scale: 0.95, duration: 70, yoyo: true });
      });
      card.on('pointerup', () => this.selectLevel(id, isUnlocked));
      card.setAlpha(0);
      card.setY(y + 20);
      this.tweens.add({
        targets: card,
        alpha: 1,
        y,
        delay: index * 22,
        duration: 220,
        ease: 'Sine.easeOut',
      });
    }
  }

  private selectLevel(id: number, unlocked: boolean): void {
    if (!unlocked) {
      audio.play('wrong', 0.4);
      haptics.warning();
      this.showToast('Finish earlier levels first!');
      return;
    }
    audio.play('tap', 0.5);
    this.cameras.main.fadeOut(160, 255, 243, 224);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENES.Game, { levelId: id });
    });
  }

  private showToast(message: string): void {
    const toast = this.add
      .text(360, 1190, message, {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        fontStyle: 'bold',
        color: CSS.white,
        backgroundColor: '#4a3b53',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setAlpha(0);
    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: 1165,
      duration: 180,
      yoyo: true,
      hold: 900,
      onComplete: () => toast.destroy(),
    });
  }

  private go(key: string): void {
    audio.play('tap', 0.4);
    this.cameras.main.fadeOut(140, 255, 243, 224);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(key);
    });
  }
}

