import Phaser from 'phaser';
import { DAILY_REWARDS } from '@/config/constants';
import { LEVEL_COUNT } from '@/config/levels';
import { SCENES } from '@/config/sceneKeys';
import { save } from '@/services/SaveService';
import { audio } from '@/services/AudioManager';
import { haptics } from '@/services/HapticsService';
import { Button } from '@/ui/Button';
import { Modal } from '@/ui/Modal';
import { Panel } from '@/ui/Panel';
import { COLORS, CSS, FONT_FAMILY, textStyle } from '@/ui/theme';

export class MenuScene extends Phaser.Scene {
  private coinText!: Phaser.GameObjects.Text;
  private dailyBadge: Phaser.GameObjects.Container | null = null;
  private dailyModal: Modal | null = null;

  constructor() {
    super(SCENES.Menu);
  }

  create(): void {
    this.cameras.main.fadeIn(260, 255, 243, 224);
    this.add.image(360, 640, 'bg-clinic').setDepth(0);
    this.drawDecor();
    this.drawTitle();
    this.drawTopBar();
    this.drawButtons();
    this.drawStats();
    this.applyAudio();
    this.input.once('pointerdown', () => audio.unlock());

    this.events.on(Phaser.Scenes.Events.WAKE, this.refresh, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.WAKE, this.refresh, this);
    });
  }

  private drawDecor(): void {
    const cat = this.add
      .image(118, 500, 'pet-cat-happy')
      .setScale(0.8)
      .setAngle(-8)
      .setDepth(4);
    const dog = this.add
      .image(604, 486, 'pet-dog-idle')
      .setScale(0.74)
      .setFlipX(true)
      .setAngle(7)
      .setDepth(4);
    this.tweens.add({
      targets: cat,
      y: 488,
      angle: -4,
      yoyo: true,
      repeat: -1,
      duration: 1200,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: dog,
      y: 474,
      angle: 3,
      yoyo: true,
      repeat: -1,
      duration: 1450,
      ease: 'Sine.easeInOut',
    });

    for (let i = 0; i < 5; i += 1) {
      const sparkle = this.add
        .image(70 + i * 145, 150 + (i % 2) * 36, 'fx-sparkle')
        .setTint(i % 2 === 0 ? 0xffd166 : 0xf79bb5)
        .setScale(0.45)
        .setAlpha(0.55)
        .setDepth(3);
      this.tweens.add({
        targets: sparkle,
        alpha: 0.15,
        scale: 0.3,
        yoyo: true,
        repeat: -1,
        duration: 900 + i * 160,
      });
    }
  }

  private drawTitle(): void {
    const title = this.add.container(360, 292).setDepth(6);
    const shadow = this.add.ellipse(0, 168, 430, 44, 0x3a2b3e, 0.16);
    const paw = this.add.image(0, -118, 'logo-paw').setScale(1.05);
    const petClinic = this.add
      .text(0, -32, 'PET CLINIC', {
        fontFamily: FONT_FAMILY,
        fontSize: '48px',
        fontStyle: 'bold',
        color: CSS.ink,
        stroke: '#fffdf9',
        strokeThickness: 10,
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    const rush = this.add
      .text(0, 42, 'RUSH', {
        fontFamily: FONT_FAMILY,
        fontSize: '86px',
        fontStyle: 'bold',
        color: CSS.pink,
        stroke: '#fffdf9',
        strokeThickness: 12,
        letterSpacing: 6,
      })
      .setOrigin(0.5);
    const tagline = this.add
      .text(0, 108, 'Cure cute pets. Fast!', {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        fontStyle: 'bold',
        color: CSS.inkSoft,
        backgroundColor: '#fff8ee',
        padding: { x: 16, y: 6 },
      })
      .setOrigin(0.5);
    title.add([shadow, paw, petClinic, rush, tagline]);
    title.setScale(0.7).setAlpha(0);
    this.tweens.add({
      targets: title,
      scale: 1,
      alpha: 1,
      duration: 420,
      ease: 'Back.easeOut',
    });
  }

  private drawTopBar(): void {
    const bar = this.add.container(0, 0).setDepth(8);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.shadow, 0.12);
    bg.fillRoundedRect(22, 28, 188, 60, 30);
    bg.fillStyle(0xfffdf9, 0.97);
    bg.fillRoundedRect(22, 24, 188, 60, 30);
    const coin = this.add.image(58, 54, 'ui-coin').setDisplaySize(42, 42);
    this.coinText = this.add
      .text(92, 54, String(save.getCoins()), textStyle(30, CSS.ink))
      .setOrigin(0, 0.5);
    bar.add([bg, coin, this.coinText]);

    new Button(this, 660, 54, {
      label: '',
      width: 62,
      height: 62,
      radius: 22,
      color: COLORS.lilac,
      icon: 'icon-gear',
      iconScale: 0.8,
      onClick: () => this.go(SCENES.Settings),
    }).setDepth(8);
  }

  private drawButtons(): void {
    const level = save.getUnlockedLevel();
    const play = new Button(this, 360, 650, {
      label: save.getData().tutorialSeen ? `PLAY LEVEL ${level}` : 'PLAY',
      width: 440,
      height: 112,
      radius: 34,
      color: COLORS.mint,
      icon: 'icon-play',
      iconScale: 0.9,
      fontSize: 40,
      onClick: () => this.startPlay(),
    });
    play.setDepth(9);
    this.tweens.add({
      targets: play,
      scaleX: 1.03,
      scaleY: 1.03,
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: 'Sine.easeInOut',
    });

    const levels = new Button(this, 232, 790, {
      label: 'LEVELS',
      width: 226,
      height: 86,
      color: COLORS.blue,
      icon: 'paw',
      iconScale: 0.62,
      fontSize: 27,
      onClick: () => this.go(SCENES.LevelSelect),
    });
    const shop = new Button(this, 488, 790, {
      label: 'SHOP',
      width: 226,
      height: 86,
      color: COLORS.pink,
      icon: 'ui-coin',
      iconScale: 0.62,
      fontSize: 27,
      onClick: () => this.go(SCENES.Shop),
    });
    levels.setDepth(9);
    shop.setDepth(9);

    const daily = new Button(this, 232, 900, {
      label: 'DAILY GIFT',
      width: 226,
      height: 78,
      color: COLORS.yellow,
      textColor: CSS.ink,
      icon: 'ui-star',
      iconScale: 0.6,
      fontSize: 22,
      onClick: () => this.openDaily(),
    });
    const settings = new Button(this, 488, 900, {
      label: 'SETTINGS',
      width: 226,
      height: 78,
      color: COLORS.lilac,
      icon: 'icon-gear',
      iconScale: 0.6,
      fontSize: 22,
      onClick: () => this.go(SCENES.Settings),
    });
    daily.setDepth(9);
    settings.setDepth(9);

    const info = save.getDailyInfo();
    if (info.canClaim) {
      this.dailyBadge = this.add.container(318, 872).setDepth(12);
      const circle = this.add.circle(0, 0, 17, COLORS.coral);
      const label = this.add
        .text(0, 0, '!', {
          fontFamily: FONT_FAMILY,
          fontSize: '22px',
          fontStyle: 'bold',
          color: CSS.white,
        })
        .setOrigin(0.5);
      this.dailyBadge.add([circle, label]);
      this.tweens.add({
        targets: this.dailyBadge,
        scale: 1.18,
        yoyo: true,
        repeat: -1,
        duration: 520,
      });
    }
  }

  private drawStats(): void {
    const panel = new Panel(this, 360, 1085, 560, 132, {
      color: COLORS.panel,
      radius: 32,
      border: COLORS.pinkLight,
    });
    panel.setDepth(7);
    const stars = save.getTotalStars();
    const best = save.getData().bestScore;
    this.add.image(205, 1062, 'ui-star').setDisplaySize(38, 38).setDepth(8);
    this.add
      .text(232, 1062, `${stars} / ${LEVEL_COUNT * 3}`, textStyle(27, CSS.ink))
      .setOrigin(0, 0.5)
      .setDepth(8);
    this.add.image(205, 1108, 'icon-trophy').setDisplaySize(34, 34).setDepth(8);
    this.add
      .text(232, 1108, `BEST ${best}`, textStyle(24, CSS.inkSoft))
      .setOrigin(0, 0.5)
      .setDepth(8);
    this.add
      .text(360, 1224, 'v1.0 · portrait clinic fun', textStyle(17, CSS.inkSoft))
      .setOrigin(0.5)
      .setAlpha(0.55);
  }

  private startPlay(): void {
    const data = save.getData();
    if (!data.tutorialSeen) {
      this.go(SCENES.Tutorial, { thenPlay: true, levelId: data.level });
      return;
    }
    this.go(SCENES.Game, { levelId: data.level });
  }

  private openDaily(): void {
    if (this.dailyModal?.active) return;
    const info = save.getDailyInfo();
    const modal = new Modal(this, 'Daily gift', 600, 780);
    this.dailyModal = modal;
    const content = modal.content;

    content.add(
      this.add
        .text(0, -250, 'Come back each day for a bigger treat!', {
          fontFamily: FONT_FAMILY,
          fontSize: '22px',
          color: CSS.inkSoft,
        })
        .setOrigin(0.5),
    );

    const positions = [
      [-210, -150],
      [-70, -150],
      [70, -150],
      [210, -150],
      [-140, -20],
      [0, -20],
      [140, -20],
    ];
    DAILY_REWARDS.forEach((reward, index) => {
      const [x, y] = positions[index] ?? [0, 0];
      const claimed = index < info.day - 1;
      const current = index === info.day - 1;
      const card = this.add.container(x, y);
      const bg = this.add.graphics();
      const color = current ? COLORS.mint : claimed ? COLORS.panelAlt : 0xf4e9dd;
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-59, -54, 118, 108, 18);
      if (current) {
        bg.lineStyle(4, COLORS.mintDark, 1);
        bg.strokeRoundedRect(-59, -54, 118, 108, 18);
      }
      const day = this.add
        .text(0, -34, `DAY ${index + 1}`, {
          fontFamily: FONT_FAMILY,
          fontSize: '15px',
          fontStyle: 'bold',
          color: CSS.inkSoft,
        })
        .setOrigin(0.5);
      const coin = this.add.image(0, 0, 'ui-coin').setDisplaySize(34, 34);
      const amount = this.add
        .text(0, 34, String(reward), {
          fontFamily: FONT_FAMILY,
          fontSize: '20px',
          fontStyle: 'bold',
          color: CSS.ink,
        })
        .setOrigin(0.5);
      card.add([bg, day, coin, amount]);
      if (claimed) {
        const check = this.add.image(38, -36, 'ui-check').setDisplaySize(24, 24);
        card.add(check);
      }
      if (current && info.canClaim) {
        this.tweens.add({
          targets: card,
          scale: 1.05,
          yoyo: true,
          repeat: -1,
          duration: 600,
        });
      }
      content.add(card);
    });

    const claim = new Button(this, 0, 262, {
      label: info.canClaim ? `CLAIM ${info.reward} COINS` : 'COME BACK TOMORROW',
      width: 420,
      height: 92,
      color: info.canClaim ? COLORS.pink : 0xc8bcc4,
      icon: info.canClaim ? 'ui-coin' : undefined,
      iconScale: 0.6,
      fontSize: 25,
      enabled: info.canClaim,
      onClick: () => {
        const claimed = save.claimDaily();
        if (claimed.reward <= 0) return;
        audio.play('coin', 0.7);
        haptics.success();
        this.refresh();
        modal.close();
        this.showToast(`+${claimed.reward} coins!`);
      },
    });
    content.add(claim);
    audio.play('open', 0.4);
  }

  private showToast(message: string): void {
    const toast = this.add
      .text(360, 1000, message, {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
        fontStyle: 'bold',
        color: CSS.white,
        backgroundColor: '#4a3b53',
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(20);
    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: 972,
      duration: 220,
      yoyo: true,
      hold: 900,
      onComplete: () => toast.destroy(),
    });
  }

  private refresh(): void {
    this.coinText?.setText(String(save.getCoins()));
    this.dailyBadge?.setVisible(save.getDailyInfo().canClaim);
  }

  private applyAudio(): void {
    audio.bind(this);
    const settings = save.getSettings();
    audio.setSettings(settings.musicEnabled, settings.sfxEnabled);
    haptics.setEnabled(settings.vibrationEnabled);
  }

  private go(key: string, data?: object): void {
    audio.play('tap', 0.4);
    this.cameras.main.fadeOut(160, 255, 243, 224);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(key, data);
    });
  }
}

