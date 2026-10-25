import Phaser from 'phaser';
import type { NeedKind, PetKind } from '@/contracts/types';
import { DEPTH } from '@/ui/theme';
import { PatienceBar } from './PatienceBar';
import { ThoughtBubble } from './ThoughtBubble';

export interface CustomerOptions {
  id: number;
  petKind: PetKind;
  needs: NeedKind[];
  patience: number;
  slot: number;
}

export class Customer extends Phaser.GameObjects.Container {
  readonly customerId: number;
  readonly petKind: PetKind;
  readonly needs: NeedKind[];
  readonly slot: number;
  patienceMax: number;
  patienceLeft: number;
  private readonly art: Phaser.GameObjects.Image;
  private readonly carried: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  readonly bubble: ThoughtBubble;
  private readonly bar: PatienceBar;
  private activePatient = true;
  private bubbleScale = 0.72;

  constructor(scene: Phaser.Scene, x: number, y: number, options: CustomerOptions) {
    super(scene, x, y);
    this.customerId = options.id;
    this.petKind = options.petKind;
    this.needs = options.needs;
    this.slot = options.slot;
    this.patienceMax = Math.max(10, options.patience);
    this.patienceLeft = this.patienceMax;
    this.setDepth(DEPTH.customer);

    this.shadow = scene.add.ellipse(0, -4, 96, 24, 0x3a2b3e, 0.16);
    this.art = scene.add
      .image(0, 0, `customer-${options.id % 8}`)
      .setOrigin(0.5, 1)
      .setScale(0.62);
    this.carried = scene.add
      .image(12, -108, `pet-${options.petKind}-sick`)
      .setOrigin(0.5)
      .setScale(0.46)
      .setAngle(-4);
    this.bubble = new ThoughtBubble(scene, 0, -238).setNeeds(options.needs);
    this.bubble.setBubbleScale(this.bubbleScale);
    this.bar = new PatienceBar(scene, 0, -318, 112);

    this.add([this.shadow, this.art, this.carried, this.bubble, this.bar]);
    this.setSize(120, 220);
    this.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 120, 220),
      Phaser.Geom.Rectangle.Contains,
    );
    this.input!.cursor = 'pointer';
    scene.add.existing(this);
    this.startIdle();
  }

  get ratio(): number {
    return this.patienceLeft / this.patienceMax;
  }

  setBubbleScale(value: number): void {
    this.bubbleScale = value;
    this.bubble.setBubbleScale(value);
  }

  updatePatience(deltaMs: number, multiplier = 1): boolean {
    if (!this.activePatient) return false;
    this.patienceLeft = Math.max(0, this.patienceLeft - (deltaMs / 1000) * multiplier);
    this.bar.setRatio(this.ratio);
    if (this.patienceLeft <= 0) {
      this.activePatient = false;
      return true;
    }
    return false;
  }

  pausePatience(): void {
    this.activePatient = false;
  }

  resumePatience(): void {
    if (this.patienceLeft > 0) this.activePatient = true;
  }

  setCarrying(visible: boolean): void {
    this.carried.setVisible(visible);
    this.bubble.setVisible(visible);
  }

  markNeedDone(need: NeedKind): void {
    this.bubble.markDone(need);
  }

  faceTowards(x: number): void {
    const flip = x < this.x;
    this.art.setFlipX(flip);
    this.carried.setX(flip ? -12 : 12);
  }

  moveToWaiting(x: number, y: number, duration = 700): void {
    this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration,
      ease: 'Sine.easeInOut',
      onComplete: () => this.startIdle(),
    });
  }

  moveToBed(x: number, y: number): void {
    this.faceTowards(x);
    this.scene.tweens.add({
      targets: this,
      x,
      y,
      scaleX: 0.76,
      scaleY: 0.76,
      duration: 550,
      ease: 'Sine.easeInOut',
    });
  }

  celebrate(): void {
    this.scene.tweens.add({
      targets: this,
      y: this.y - 18,
      duration: 160,
      yoyo: true,
      repeat: 2,
      ease: 'Quad.easeOut',
    });
  }

  angrier(): void {
    this.art.setTint(0xff9a9a);
    this.bubble.setAlpha(0.4);
  }

  leave(duration = 700): void {
    this.activePatient = false;
    this.art.setTint(0xffffff);
    this.scene.tweens.add({
      targets: this,
      x: 80,
      y: 380,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      duration,
      ease: 'Sine.easeIn',
      onComplete: () => this.destroy(),
    });
  }

  private startIdle(): void {
    if (!this.active) return;
    this.scene.tweens.add({
      targets: [this.art, this.carried],
      y: '-=4',
      duration: Phaser.Math.Between(700, 950),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}


