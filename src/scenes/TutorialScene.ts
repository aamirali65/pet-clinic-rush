import Phaser from 'phaser';
import { SCENES } from '@/config/sceneKeys';
import { audio } from '@/services/AudioManager';
import { haptics } from '@/services/HapticsService';
import { save } from '@/services/SaveService';
import { Button } from '@/ui/Button';
import { Panel } from '@/ui/Panel';
import { COLORS, CSS, FONT_FAMILY } from '@/ui/theme';

interface TutorialData {
  thenPlay?: boolean;
  levelId?: number;
  fromSettings?: boolean;
  fromPause?: boolean;
}

const STEPS = [
  {
    title: 'Pick up a pet',
    body: 'Tap a customer in the waiting room. Their pet hops into your hand with a bubble of needs.',
  },
  {
    title: 'Find a cozy bed',
    body: 'Tap or drag the pet onto a free bed. The owner follows and waits nearby while you work.',
  },
  {
    title: 'Treat every need',
    body: 'Tap the bed, choose the matching tool, and follow the short action. Fix all needs to cure the pet!',
  },
];

export class TutorialScene extends Phaser.Scene {
  private step = 0;
  private payload!: TutorialData;
  private stage!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private dots: Phaser.GameObjects.Arc[] = [];
  private backButton!: Button;
  private nextButton!: Button;

  constructor() {
    super(SCENES.Tutorial);
  }

  init(data: TutorialData): void {
    this.payload = data ?? {};
    this.step = 0;
    this.dots = [];
  }

  create(): void {
    this.cameras.main.fadeIn(220, 255, 243, 224);
    this.add.image(360, 640, 'bg-clinic').setDepth(0);
    this.add.rectangle(360, 640, 720, 1280, 0x2c2233, 0.48).setDepth(1);
    new Panel(this, 360, 640, 620, 980, {
      color: COLORS.panel,
      radius: 46,
      border: COLORS.yellow,
    }).setDepth(3);

    this.add
      .text(360, 232, 'HOW TO PLAY', {
        fontFamily: FONT_FAMILY,
        fontSize: '26px',
        fontStyle: 'bold',
        color: CSS.blue,
        letterSpacing: 2,
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.titleText = this.add
      .text(360, 296, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '42px',
        fontStyle: 'bold',
        color: CSS.ink,
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.bodyText = this.add
      .text(360, 350, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '21px',
        color: CSS.inkSoft,
        align: 'center',
        wordWrap: { width: 500 },
        lineSpacing: 5,
      })
      .setOrigin(0.5, 0)
      .setDepth(5);

    this.stage = this.add.container(0, 0).setDepth(4);
    this.add
      .text(360, 850, 'A happy pet is a paid pet!', {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: CSS.inkSoft,
      })
      .setOrigin(0.5)
      .setAlpha(0.7)
      .setDepth(5);

    this.dots = [0, 1, 2].map((index) =>
      this.add.circle(318 + index * 42, 890, 8, index === 0 ? COLORS.pink : 0xe7dbd1).setDepth(5),
    );

    this.backButton = new Button(this, 204, 988, {
      label: 'BACK',
      width: 218,
      height: 80,
      color: COLORS.panelAlt,
      textColor: CSS.inkSoft,
      fontSize: 24,
      onClick: () => this.goBack(),
    });
    this.backButton.setDepth(5);
    this.nextButton = new Button(this, 516, 988, {
      label: 'NEXT',
      width: 218,
      height: 80,
      color: COLORS.mint,
      icon: 'icon-arrow-right',
      iconScale: 0.62,
      fontSize: 24,
      onClick: () => this.next(),
    });
    this.nextButton.setDepth(5);

    new Button(this, 600, 200, {
      label: 'SKIP',
      width: 110,
      height: 50,
      color: COLORS.pinkLight,
      textColor: CSS.inkSoft,
      fontSize: 18,
      onClick: () => this.finish(),
    }).setDepth(5);

    this.renderStep();
    audio.bind(this);
    const settings = save.getSettings();
    audio.setSettings(settings.musicEnabled, settings.sfxEnabled);
  }

  private renderStep(): void {
    const step = STEPS[this.step] ?? STEPS[0]!;
    this.titleText.setText(step.title);
    this.bodyText.setText(step.body);
    this.backButton.setVisible(this.step > 0);
    this.nextButton.setText(this.step === STEPS.length - 1 ? 'GOT IT!' : 'NEXT');
    this.nextButton.setButtonColor(this.step === STEPS.length - 1 ? COLORS.pink : COLORS.mint);
    this.dots.forEach((dot, index) => {
      dot.setFillStyle(index === this.step ? COLORS.pink : 0xe7dbd1);
      dot.setScale(index === this.step ? 1.25 : 1);
    });
    this.stage.removeAll(true);
    this.buildStage();
    this.titleText.setAlpha(0).setY(304);
    this.tweens.add({
      targets: this.titleText,
      alpha: 1,
      y: 296,
      duration: 200,
    });
    this.stage.setAlpha(0);
    this.tweens.add({ targets: this.stage, alpha: 1, duration: 220 });
  }

  private buildStage(): void {
    if (this.step === 0) {
      const customer = this.add.image(254, 660, 'customer-0').setScale(0.8);
      const pet = this.add.image(414, 584, 'pet-cat-sick').setScale(0.85);
      const bubble = this.add.image(414, 468, 'bubble').setScale(0.72);
      const needA = this.add.image(390, 458, 'need-fever').setDisplaySize(38, 38);
      const needB = this.add.image(430, 458, 'need-dirty').setDisplaySize(38, 38);
      const ring = this.add.circle(414, 584, 70, 0xffd166, 0.16).setStrokeStyle(4, COLORS.yellow, 0.7);
      this.tweens.add({
        targets: ring,
        scale: 1.12,
        alpha: 0.35,
        yoyo: true,
        repeat: -1,
        duration: 650,
      });
      const arrow = this.add.image(470, 676, 'arrow').setScale(0.62).setAngle(-40);
      this.tweens.add({
        targets: arrow,
        x: 438,
        y: 640,
        yoyo: true,
        repeat: -1,
        duration: 600,
        ease: 'Sine.easeInOut',
      });
      this.stage.add([customer, pet, bubble, needA, needB, ring, arrow]);
      this.addTag(414, 700, 'TAP THE PET');
    } else if (this.step === 1) {
      const bed = this.add.image(360, 690, 'bed-0').setScale(1.05);
      const pet = this.add.image(360, 590, 'pet-cat-sick').setScale(0.85);
      const arrow = this.add.image(492, 500, 'arrow').setScale(0.72).setAngle(115);
      this.tweens.add({
        targets: arrow,
        x: 430,
        y: 590,
        yoyo: true,
        repeat: -1,
        duration: 700,
        ease: 'Sine.easeInOut',
      });
      const highlight = this.add.image(360, 630, 'highlight').setDisplaySize(220, 150).setAlpha(0.7);
      this.tweens.add({
        targets: highlight,
        alpha: 0.25,
        yoyo: true,
        repeat: -1,
        duration: 700,
      });
      this.stage.add([bed, highlight, pet, arrow]);
      this.addTag(360, 760, 'DROP ON BED');
    } else {
      const pet = this.add.image(360, 600, 'pet-cat-sick').setScale(0.95);
      const bubble = this.add.image(360, 468, 'bubble').setScale(0.8);
      const needs = [
        this.add.image(330, 458, 'need-fever').setDisplaySize(38, 38),
        this.add.image(360, 458, 'need-hungry').setDisplaySize(38, 38),
        this.add.image(390, 458, 'need-sleepy').setDisplaySize(38, 38),
      ];
      const tools = ['tool-thermometer', 'tool-food', 'tool-pillow'];
      const positions = [230, 360, 490];
      tools.forEach((tool, index) => {
        const icon = this.add.image(positions[index]!, 760, tool).setDisplaySize(60, 60);
        const circle = this.add.circle(positions[index]!, 760, 42, COLORS.pinkLight);
        this.stage.add([circle, icon]);
        this.tweens.add({
          targets: icon,
          y: 748,
          yoyo: true,
          repeat: -1,
          duration: 700 + index * 120,
          ease: 'Sine.easeInOut',
        });
      });
      const arrow = this.add.image(610, 690, 'arrow').setScale(0.6).setAngle(160);
      this.stage.add([pet, bubble, ...needs, arrow]);
      this.addTag(360, 830, 'MATCH TOOL TO NEED');
    }
  }

  private addTag(x: number, y: number, text: string): void {
    const tag = this.add
      .text(x, y, text, {
        fontFamily: FONT_FAMILY,
        fontSize: '17px',
        fontStyle: 'bold',
        color: CSS.white,
        backgroundColor: '#4a3b53',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5);
    this.stage.add(tag);
  }

  private next(): void {
    audio.play('tap', 0.4);
    if (this.step >= STEPS.length - 1) {
      this.finish();
      return;
    }
    this.step += 1;
    haptics.light();
    this.renderStep();
  }

  private goBack(): void {
    if (this.step <= 0) return;
    audio.play('tap', 0.35);
    this.step -= 1;
    this.renderStep();
  }

  private finish(): void {
    save.setTutorialSeen();
    audio.play('tap', 0.5);
    if (this.payload.fromSettings) {
      this.scene.start(SCENES.Settings, { fromPause: this.payload.fromPause === true });
      return;
    }
    if (this.payload.thenPlay) {
      this.scene.start(SCENES.Game, { levelId: this.payload.levelId ?? save.getUnlockedLevel() });
      return;
    }
    this.scene.start(SCENES.Menu);
  }
}

