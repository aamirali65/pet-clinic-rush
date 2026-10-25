import Phaser from 'phaser';
import type { NeedKind, PetKind } from '@/contracts/types';
import { DEPTH } from '@/ui/theme';
import { ThoughtBubble } from './ThoughtBubble';

export class Pet extends Phaser.GameObjects.Container {
  readonly patientId: number;
  readonly kind: PetKind;
  readonly needs: NeedKind[];
  private readonly art: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  readonly bubble: ThoughtBubble;
  private readonly remaining: Set<NeedKind>;
  private done = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    patientId: number,
    kind: PetKind,
    needs: NeedKind[],
  ) {
    super(scene, x, y);
    this.patientId = patientId;
    this.kind = kind;
    this.needs = [...needs];
    this.remaining = new Set(needs);
    this.setDepth(DEPTH.pet);

    this.shadow = scene.add.ellipse(0, 70, 112, 28, 0x3a2b3e, 0.15);
    this.art = scene.add
      .image(0, 22, `pet-${kind}-sick`)
      .setOrigin(0.5)
      .setScale(0.82);
    this.bubble = new ThoughtBubble(scene, 0, -130).setNeeds(this.needs);
    this.bubble.setBubbleScale(0.82);
    this.add([this.shadow, this.art, this.bubble]);
    this.setSize(150, 140);
    scene.add.existing(this);
    this.startIdle();
  }

  get isCured(): boolean {
    return this.done || this.remaining.size === 0;
  }

  get remainingNeeds(): NeedKind[] {
    return [...this.remaining];
  }

  hasNeed(need: NeedKind): boolean {
    return this.remaining.has(need);
  }

  completeNeed(need: NeedKind): boolean {
    this.remaining.delete(need);
    this.bubble.markDone(need);
    this.scene.tweens.add({
      targets: this.art,
      scaleX: 0.92,
      scaleY: 0.92,
      duration: 140,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
    if (this.remaining.size === 0) {
      this.done = true;
      this.celebrate();
      return true;
    }
    return false;
  }

  celebrate(): void {
    this.scene.tweens.killTweensOf(this.art);
    this.bubble.setVisible(false);
    this.art.setTexture(`pet-${this.kind}-happy`);
    this.scene.tweens.add({
      targets: this.art,
      y: -12,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 220,
      yoyo: true,
      repeat: 1,
      ease: 'Quad.easeOut',
    });
    this.scene.tweens.add({
      targets: this,
      angle: 4,
      yoyo: true,
      repeat: 3,
      duration: 100,
      onComplete: () => this.setAngle(0),
    });
  }

  setHeld(held: boolean): void {
    this.setDepth(held ? 150 : DEPTH.pet);
    this.art.setScale(held ? 1.15 : 0.82);
    this.shadow.setAlpha(held ? 0.35 : 0.15);
    this.bubble.setVisible(!this.done && held);
    this.bubble.setScale(held ? 1.1 : 1);
  }

  startIdle(): void {
    this.scene.tweens.add({
      targets: this.art,
      y: 4,
      duration: Phaser.Math.Between(750, 1050),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  fadeOut(onDone: () => void): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 24,
      scaleX: 0.7,
      scaleY: 0.7,
      duration: 320,
      onComplete: onDone,
    });
  }
}

