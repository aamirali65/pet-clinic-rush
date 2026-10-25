import Phaser from 'phaser';
import { SCENES } from '@/config/sceneKeys';
import { audio } from '@/services/AudioManager';
import { haptics } from '@/services/HapticsService';
import { save } from '@/services/SaveService';
import { Button } from '@/ui/Button';
import { Modal } from '@/ui/Modal';
import { Panel } from '@/ui/Panel';
import { Toggle } from '@/ui/Toggle';
import { COLORS, CSS, FONT_FAMILY } from '@/ui/theme';

export class SettingsScene extends Phaser.Scene {
  private fromPause = false;
  private musicToggle!: Toggle;
  private sfxToggle!: Toggle;
  private vibrationToggle!: Toggle;
  private resetModal: Modal | null = null;
  private togglesChanged = false;

  constructor() {
    super(SCENES.Settings);
  }

  init(data: { fromPause?: boolean }): void {
    this.fromPause = data.fromPause === true;
  }

  create(): void {
    this.cameras.main.fadeIn(180, 255, 243, 224);
    this.add.image(360, 640, 'bg-clinic').setDepth(0);
    this.add.rectangle(360, 640, 720, 1280, 0x2c2233, this.fromPause ? 0.55 : 0.35);
    const panel = new Panel(this, 360, 640, 600, 920, {
      color: COLORS.panel,
      radius: 44,
      border: COLORS.lilac,
    });
    panel.setDepth(3);

    this.add
      .text(360, 250, 'SETTINGS', {
        fontFamily: FONT_FAMILY,
        fontSize: '46px',
        fontStyle: 'bold',
        color: CSS.ink,
      })
      .setOrigin(0.5)
      .setDepth(4);
    this.add
      .text(360, 300, 'Make the clinic feel right.', {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        color: CSS.inkSoft,
      })
      .setOrigin(0.5)
      .setDepth(4);

    const settings = save.getSettings();
    this.musicToggle = new Toggle(
      this,
      360,
      390,
      'Music',
      settings.musicEnabled,
      (value) => {
        this.togglesChanged = true;
        save.setSettings({ musicEnabled: value });
        audio.setMusicEnabled(value);
        audio.play('tap', 0.4);
      },
    );
    this.sfxToggle = new Toggle(
      this,
      360,
      486,
      'Sound effects',
      settings.sfxEnabled,
      (value) => {
        this.togglesChanged = true;
        save.setSettings({ sfxEnabled: value });
        audio.setSfxEnabled(value);
        if (value) audio.play('tap', 0.4);
      },
    );
    this.vibrationToggle = new Toggle(
      this,
      360,
      582,
      'Vibration',
      settings.vibrationEnabled,
      (value) => {
        this.togglesChanged = true;
        save.setSettings({ vibrationEnabled: value });
        haptics.setEnabled(value);
        if (value) haptics.light();
      },
    );
    [this.musicToggle, this.sfxToggle, this.vibrationToggle].forEach((toggle) =>
      toggle.setDepth(4),
    );

    this.add
      .text(360, 650, 'Progress saves automatically after every level.', {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: CSS.inkSoft,
        align: 'center',
        wordWrap: { width: 460 },
      })
      .setOrigin(0.5, 0)
      .setDepth(4)
      .setAlpha(0.75);

    new Button(this, 360, 724, {
      label: 'HOW TO PLAY',
      width: 440,
      height: 76,
      color: COLORS.blue,
      icon: 'icon-question',
      iconScale: 0.62,
      fontSize: 24,
      onClick: () => {
        audio.play('tap', 0.4);
        this.scene.start(SCENES.Tutorial, { fromSettings: true, fromPause: this.fromPause });
      },
    }).setDepth(4);

    new Button(this, 360, 818, {
      label: 'RESET PROGRESS',
      width: 440,
      height: 70,
      color: COLORS.coral,
      fontSize: 22,
      onClick: () => this.confirmReset(),
    }).setDepth(4);

    new Button(this, 360, 940, {
      label: this.fromPause ? 'BACK TO GAME' : 'DONE',
      width: 440,
      height: 94,
      color: COLORS.mint,
      icon: this.fromPause ? 'icon-play' : 'icon-check',
      iconScale: 0.7,
      fontSize: 30,
      onClick: () => this.close(),
    }).setDepth(4);

    this.add
      .text(360, 1020, 'Pet Clinic Rush · v1.0', {
        fontFamily: FONT_FAMILY,
        fontSize: '16px',
        color: CSS.inkSoft,
      })
      .setOrigin(0.5)
      .setAlpha(0.55)
      .setDepth(4);

    audio.bind(this);
    audio.setSettings(settings.musicEnabled, settings.sfxEnabled);
    haptics.setEnabled(settings.vibrationEnabled);
  }

  private confirmReset(): void {
    if (this.resetModal?.active) return;
    const modal = new Modal(this, 'Reset progress?', 560, 560);
    this.resetModal = modal;
    const content = modal.content;
    content.add(
      this.add
        .text(0, -80, 'Stars, coins, levels and shop upgrades\nwill be reset. Settings stay as they are.', {
          fontFamily: FONT_FAMILY,
          fontSize: '22px',
          color: CSS.inkSoft,
          align: 'center',
          lineSpacing: 8,
        })
        .setOrigin(0.5),
    );
    const yes = new Button(this, 0, 60, {
      label: 'YES, RESET',
      width: 380,
      height: 80,
      color: COLORS.coral,
      fontSize: 24,
      onClick: () => {
        void save.resetProgress().then(() => {
          this.refreshToggles();
          modal.close();
          this.showToast('Progress reset.');
          audio.play('close', 0.4);
        });
      },
    });
    const no = new Button(this, 0, 160, {
      label: 'KEEP MY CLINIC',
      width: 380,
      height: 72,
      color: COLORS.mint,
      fontSize: 22,
      onClick: () => modal.close(),
    });
    content.add([yes, no]);
  }

  private refreshToggles(): void {
    const settings = save.getSettings();
    this.musicToggle.setValue(settings.musicEnabled);
    this.sfxToggle.setValue(settings.sfxEnabled);
    this.vibrationToggle.setValue(settings.vibrationEnabled);
    audio.setSettings(settings.musicEnabled, settings.sfxEnabled);
    haptics.setEnabled(settings.vibrationEnabled);
  }

  private showToast(message: string): void {
    const toast = this.add
      .text(360, 1110, message, {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        fontStyle: 'bold',
        color: CSS.white,
        backgroundColor: '#4a3b53',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setAlpha(0);
    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: 1085,
      duration: 180,
      yoyo: true,
      hold: 900,
      onComplete: () => toast.destroy(),
    });
  }

  private close(): void {
    audio.play('tap', 0.4);
    if (this.togglesChanged) void save.flush();
    if (this.fromPause) {
      this.scene.resume(SCENES.Game);
      this.scene.stop();
      return;
    }
    this.scene.start(SCENES.Menu);
  }
}

