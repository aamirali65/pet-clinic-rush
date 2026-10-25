import Phaser from 'phaser';
import type { NeedConfig, NeedKind, PetKind } from '@/contracts/types';
import { audio } from '@/services/AudioManager';
import { haptics } from '@/services/HapticsService';
import { Button } from './Button';
import { Panel } from './Panel';
import { COLORS, CSS, FONT_FAMILY } from './theme';

const PET_X = 360;
const PET_Y = 548;
const REACH = 135;

type Phase = 'drag' | 'hold' | 'second' | 'scrub' | 'strokes' | 'taps' | 'done';

export class TreatmentOverlay extends Phaser.GameObjects.Container {
  private readonly need: NeedConfig;
  private readonly onComplete: () => void;
  private readonly speed: number;
  private readonly pet: Phaser.GameObjects.Image;
  private readonly target: Phaser.GameObjects.Arc;
  private readonly instruction: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly progressFill: Phaser.GameObjects.Graphics;
  private readonly progressLabel: Phaser.GameObjects.Text;
  private tool: Phaser.GameObjects.Image | null = null;
  private actionButton: Button | null = null;
  private phase: Phase = 'drag';
  private progress = 0;
  private holding = false;
  private dragging = false;
  private finished = false;
  private scrub = 0;
  private strokes = 0;
  private strokeDirection = 0;
  private taps = 0;
  private lastX = 0;
  private lastY = 0;

  constructor(
    scene: Phaser.Scene,
    need: NeedConfig,
    onComplete: () => void,
    petKind?: PetKind,
    speed = 1,
  ) {
    super(scene, 0, 0);
    this.need = need;
    this.onComplete = onComplete;
    this.speed = Math.max(0.5, speed);
    this.setDepth(500);

    const dim = scene.add.rectangle(360, 640, 720, 1280, 0x2c2233, 0.62).setInteractive();
    const panel = new Panel(scene, 360, 640, 620, 780, {
      color: COLORS.panel,
      radius: 42,
      border: COLORS.pinkLight,
    });
    this.add([dim, panel]);

    this.add(
      scene.add
        .text(360, 286, `${need.name} care`, {
          fontFamily: FONT_FAMILY,
          fontSize: '34px',
          fontStyle: 'bold',
          color: CSS.ink,
        })
        .setOrigin(0.5),
    );
    this.add(
      scene.add.image(360, 318, need.icon).setDisplaySize(44, 44).setOrigin(0.5),
    );

    this.pet = scene.add
      .image(PET_X, PET_Y, petKind ? `pet-${petKind}-sick` : 'pet-cat-sick')
      .setScale(1.05)
      .setDepth(505);
    this.add(this.pet);
    this.scene.tweens.add({
      targets: this.pet,
      y: PET_Y - 7,
      yoyo: true,
      repeat: -1,
      duration: 780,
      ease: 'Sine.easeInOut',
    });

    this.target = scene.add
      .circle(PET_X, PET_Y - 18, 94, 0xffd166, 0.08)
      .setStrokeStyle(4, COLORS.yellow, 0.65)
      .setDepth(504);
    this.add(this.target);
    scene.tweens.add({
      targets: this.target,
      scale: 1.08,
      alpha: 0.45,
      yoyo: true,
      repeat: -1,
      duration: 700,
    });

    this.instruction = scene.add
      .text(360, 680, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '27px',
        fontStyle: 'bold',
        color: CSS.ink,
        wordWrap: { width: 520 },
      })
      .setOrigin(0.5);
    this.hint = scene.add
      .text(360, 718, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '19px',
        color: CSS.inkSoft,
        align: 'center',
        wordWrap: { width: 500 },
      })
      .setOrigin(0.5);
    this.add([this.instruction, this.hint]);

    const bar = scene.add.graphics();
    bar.fillStyle(0x4a3b53, 0.12);
    bar.fillRoundedRect(360 - 230, 770, 460, 24, 12);
    this.progressFill = scene.add.graphics();
    this.progressLabel = scene.add
      .text(360, 812, '0%', {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        fontStyle: 'bold',
        color: CSS.inkSoft,
      })
      .setOrigin(0.5);
    this.add([bar, this.progressFill, this.progressLabel]);

    scene.add.existing(this);
    if (!petKind) this.setPetTextureFromNeed();
    this.setupNeed();
    scene.input.on('pointermove', this.handlePointerMove, this);
    scene.input.on('pointerdown', this.handlePointerDown, this);
    scene.input.on('pointerup', this.handlePointerUp, this);

    this.setAlpha(0);
    scene.tweens.add({ targets: this, alpha: 1, duration: 180 });
    audio.play('open', 0.5);
  }

  setPetTexture(texture: string): this {
    this.pet.setTexture(texture);
    return this;
  }

  update(_time: number, delta: number): void {
    if (this.phase === 'hold' && this.holding && this.progress < 0.7) {
      this.progress = Math.min(0.7, this.progress + (delta / 1000) * 0.42 * this.speed);
      this.renderProgress();
      if (this.progress >= 0.7) {
        this.holding = false;
        this.showMedicine();
      }
    }
  }

  private setPetTextureFromNeed(): void {
    const kinds: Record<NeedKind, string> = {
      'need-fever': 'cat',
      'need-wound': 'dog',
      'need-dirty': 'rabbit',
      'need-hungry': 'hamster',
      'need-itchy': 'cat',
      'need-sad': 'dog',
      'need-sleepy': 'rabbit',
    };
    this.pet.setTexture(`pet-${kinds[this.need.kind] ?? 'cat'}-sick`);
  }

  private setupNeed(): void {
    const kind = this.need.kind;
    if (kind === 'need-sad') {
      this.phase = 'taps';
      this.setInstruction('Tap the heart to cheer your patient up.', 'A little love goes a long way.');
      this.target.setVisible(false);
      this.addHeartButton();
      return;
    }
    if (kind === 'need-dirty') {
      this.phase = 'scrub';
      this.setInstruction('Rub the sponge all over the messy pet.', 'Move the sponge in circles.');
      this.spawnTool(this.need.tool, 'Drag the sponge onto your patient.');
      return;
    }
    if (kind === 'need-itchy') {
      this.phase = 'strokes';
      this.setInstruction('Brush the itchy pet with gentle strokes.', 'Swipe back and forth 3 times.');
      this.spawnTool(this.need.tool, 'Drag the brush onto your patient.');
      return;
    }
    this.setInstruction(this.dragInstruction(kind), this.dragHint(kind));
    this.spawnTool(this.need.tool, 'Drag the tool onto your patient.');
  }

  private dragInstruction(kind: NeedKind): string {
    switch (kind) {
      case 'need-fever':
        return 'Take the pet’s temperature first.';
      case 'need-wound':
        return 'Cover the little wound with a bandage.';
      case 'need-hungry':
        return 'Bring the food bowl to the hungry pet.';
      case 'need-sleepy':
        return 'Tuck the sleepy pet in with a pillow.';
      default:
        return 'Use the right tool on your patient.';
    }
  }

  private dragHint(kind: NeedKind): string {
    switch (kind) {
      case 'need-fever':
        return 'Drag the thermometer onto the pet, then hold.';
      case 'need-wound':
        return 'Drop the bandage on the glowing target.';
      case 'need-hungry':
        return 'Drop the bowl near the pet’s mouth.';
      case 'need-sleepy':
        return 'Drop the pillow gently on the pet.';
      default:
        return 'Drop it on your patient.';
    }
  }

  private spawnTool(texture: string, message: string): void {
    this.tool?.destroy();
    this.tool = this.scene.add
      .image(360, 940, texture)
      .setDisplaySize(104, 104)
      .setDepth(600)
      .setInteractive({ draggable: true, useHandCursor: true });
    this.scene.input.setDraggable(this.tool);
    this.tool.on('dragstart', (pointer: Phaser.Input.Pointer) => {
      if (this.finished) return;
      this.dragging = true;
      this.lastX = pointer.worldX;
      this.lastY = pointer.worldY;
      audio.play('pick', 0.4);
      this.hint.setText(message);
    });
    this.tool.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (!this.tool || this.finished) return;
      this.tool.setPosition(dragX, dragY);
    });
    this.tool.on('dragend', () => {
      this.dragging = false;
      this.handleDrop();
    });
    this.scene.tweens.add({
      targets: this.tool,
      scale: { from: 1.1, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
    });
  }

  private handleDrop(): void {
    if (!this.tool || this.finished) return;
    const distance = Phaser.Math.Distance.Between(this.tool.x, this.tool.y, PET_X, PET_Y);
    if (distance > REACH) {
      this.scene.tweens.add({
        targets: this.tool,
        x: 360,
        y: 940,
        duration: 260,
        ease: 'Back.easeOut',
      });
      this.hint.setText('Almost! Drop it right on your patient.');
      audio.play('wrong', 0.35);
      return;
    }

    const kind = this.need.kind;
    if (kind === 'need-fever') {
      this.tool.destroy();
      this.tool = null;
      this.phase = 'hold';
      this.progress = 0;
      this.setInstruction('Now press and hold on the pet.', 'Keep your finger on the pet for a moment.');
      this.renderProgress();
      this.showHoldIndicator();
      audio.play('hold', 0.5);
      return;
    }
    if (kind === 'need-wound') {
      this.tool.setPosition(PET_X + 30, PET_Y - 20);
      this.phase = 'done';
      this.setInstruction('Bandage is on. Nice and snug!', '');
      this.finish();
      return;
    }
    if (kind === 'need-hungry') {
      this.tool.setPosition(PET_X, PET_Y + 34);
      this.phase = 'done';
      this.setInstruction('Nom nom nom...', 'The hungry tummy is happy.');
      this.finish(620);
      return;
    }
    if (kind === 'need-sleepy') {
      this.tool.setPosition(PET_X, PET_Y + 20);
      this.phase = 'done';
      this.setInstruction('Shhh... sleepy time.', 'Zzz');
      this.scene.tweens.add({ targets: this.pet, alpha: 0.65, duration: 300 });
      this.finish(700);
      return;
    }
    this.hint.setText('Drop the tool right on your patient.');
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.finished) return;
    const kind = this.need.kind;
    const inside =
      Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, PET_X, PET_Y) < REACH + 20;

    if (kind === 'need-dirty' && this.phase === 'scrub' && this.dragging && inside) {
      const distance = Phaser.Math.Distance.Between(
        pointer.worldX,
        pointer.worldY,
        this.lastX,
        this.lastY,
      );
      this.scrub += Math.min(distance, 34);
      this.lastX = pointer.worldX;
      this.lastY = pointer.worldY;
      this.progress = Math.min(0.72, this.scrub / (900 / this.speed));
      this.renderProgress();
      if (Phaser.Math.Between(0, 5) === 0) {
        this.bubble(PET_X + Phaser.Math.Between(-50, 50), PET_Y + 20, 'fx-dot');
      }
      if (this.progress >= 0.7) this.showRinse();
      return;
    }

    if (kind === 'need-itchy' && this.phase === 'strokes' && this.dragging) {
      if (inside) {
        const direction = Math.sign(pointer.worldX - this.lastX);
        if (direction !== 0 && direction !== this.strokeDirection) {
          this.strokeDirection = direction;
          this.strokes = Math.min(3, this.strokes + 1);
          this.progress = this.strokes / 3;
          this.renderProgress();
          audio.play('swipe', 0.25);
          this.bubble(PET_X + Phaser.Math.Between(-40, 40), PET_Y - 30, 'fx-sparkle');
          if (this.strokes >= 3) this.finish(350);
        }
      }
      this.lastX = pointer.worldX;
      this.lastY = pointer.worldY;
    }
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.finished) return;
    if (this.phase === 'hold' && this.need.kind === 'need-fever') {
      const distance = Phaser.Math.Distance.Between(
        pointer.worldX,
        pointer.worldY,
        PET_X,
        PET_Y,
      );
      if (distance < REACH + 60) this.holding = true;
    }
  }

  private handlePointerUp(): void {
    this.holding = false;
  }

  private showHoldIndicator(): void {
    const ring = this.scene.add
      .circle(PET_X, PET_Y, 114, 0xffffff, 0.02)
      .setStrokeStyle(6, COLORS.coral, 0.9)
      .setDepth(506);
    this.add(ring);
    this.scene.tweens.add({
      targets: ring,
      scale: 0.9,
      alpha: 0.4,
      yoyo: true,
      repeat: -1,
      duration: 500,
    });
    this.tool = this.scene.add
      .image(PET_X, PET_Y - 4, 'tool-thermometer')
      .setDisplaySize(84, 84)
      .setDepth(507)
      .setAngle(18);
    this.add(this.tool);
  }

  private showMedicine(): void {
    this.phase = 'second';
    this.target.setVisible(false);
    this.setInstruction('Temperature read. Time for medicine!', 'Tap the medicine to finish the treatment.');
    this.progress = 0.7;
    this.renderProgress();
    audio.play('sparkle', 0.4);
    const icon = this.scene.add.image(PET_X, PET_Y - 8, 'tool-medicine').setDisplaySize(78, 78).setDepth(508);
    this.add(icon);
    this.scene.tweens.add({
      targets: icon,
      scale: icon.scale * 1.15,
      yoyo: true,
      repeat: -1,
      duration: 450,
    });
    this.actionButton = new Button(this.scene, 360, 880, {
      label: 'Give medicine',
      width: 320,
      height: 82,
      color: COLORS.pink,
      icon: 'ui-plus',
      iconScale: 0.6,
      onClick: () => this.finish(),
    });
    this.add(this.actionButton);
  }

  private showRinse(): void {
    if (this.phase !== 'scrub') return;
    this.phase = 'second';
    this.setInstruction('Suds everywhere! Rinse it all off.', 'Tap the rinse button.');
    this.actionButton = new Button(this.scene, 360, 880, {
      label: 'Rinse clean',
      width: 320,
      height: 82,
      color: COLORS.blue,
      icon: 'tool-rinse',
      iconScale: 0.6,
      onClick: () => this.finish(),
    });
    this.add(this.actionButton);
    audio.play('hold', 0.35);
  }

  private addHeartButton(): void {
    this.progress = 0;
    this.renderProgress();
    this.actionButton = new Button(this.scene, 360, 872, {
      label: 'Give love',
      width: 320,
      height: 92,
      color: COLORS.pink,
      icon: 'tool-heart',
      iconScale: 0.68,
      onClick: () => {
        if (this.finished) return;
        this.taps = Math.min(5, this.taps + 1);
        this.progress = this.taps / 5;
        this.renderProgress();
        this.bubble(
          PET_X + Phaser.Math.Between(-60, 60),
          PET_Y - 60,
          this.taps >= 5 ? 'fx-sparkle' : 'heart-bit',
        );
        audio.play('pop', 0.35);
        haptics.light();
        if (this.taps >= 5) {
          this.setInstruction('Tail wagging! So much love.', '');
          this.finish(400);
        } else {
          this.actionButton?.setText(`Give love (${this.taps}/5)`);
        }
      },
    });
    this.add(this.actionButton);
  }

  private setInstruction(main: string, hint: string): void {
    this.instruction.setText(main);
    this.hint.setText(hint);
  }

  private renderProgress(): void {
    this.progressFill.clear();
    this.progressFill.fillStyle(COLORS.green, 1);
    this.progressFill.fillRoundedRect(
      130,
      770,
      Math.max(12, 460 * this.progress),
      24,
      12,
    );
    this.progressFill.fillStyle(0xffffff, 0.3);
    this.progressFill.fillRoundedRect(
      138,
      774,
      Math.max(4, 444 * this.progress),
      8,
      4,
    );
    this.progressLabel.setText(`${Math.round(this.progress * 100)}%`);
  }

  private bubble(x: number, y: number, texture: string): void {
    const bit = this.scene.add
      .image(x, y, texture)
      .setDepth(610)
      .setDisplaySize(34, 34);
    this.add(bit);
    this.scene.tweens.add({
      targets: bit,
      y: y - 70,
      alpha: 0,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => bit.destroy(),
    });
  }

  cancel(): void {
    if (this.finished) {
      this.destroy();
      return;
    }
    this.finished = true;
    this.scene?.input.off('pointermove', this.handlePointerMove, this);
    this.scene?.input.off('pointerdown', this.handlePointerDown, this);
    this.scene?.input.off('pointerup', this.handlePointerUp, this);
    this.tool?.destroy();
    this.tool = null;
    this.destroy();
  }

  private finish(delay = 420): void {
    if (this.finished) return;
    this.finished = true;
    this.phase = 'done';
    this.progress = 1;
    this.renderProgress();
    this.target.setVisible(false);
    this.tool?.disableInteractive();
    this.actionButton?.disableInteractive();
    audio.play(this.need.kind === 'need-fever' ? 'cure' : 'sparkle', 0.7);
    haptics.success();
    this.scene.tweens.add({
      targets: this.pet,
      scaleX: 1.18,
      scaleY: 0.9,
      duration: 150,
      yoyo: true,
    });
    for (let i = 0; i < 12; i += 1) {
      this.bubble(
        PET_X + Phaser.Math.Between(-70, 70),
        PET_Y + Phaser.Math.Between(-50, 50),
        'fx-sparkle',
      );
    }
    this.scene.time.delayedCall(delay, () => {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 160,
        onComplete: () => {
          this.onComplete();
          this.destroy();
        },
      });
    });
  }

  destroy(fromScene?: boolean): void {
    this.scene?.input.off('pointermove', this.handlePointerMove, this);
    this.scene?.input.off('pointerdown', this.handlePointerDown, this);
    this.scene?.input.off('pointerup', this.handlePointerUp, this);
    this.tool?.destroy();
    this.tool = null;
    super.destroy(fromScene);
  }
}



