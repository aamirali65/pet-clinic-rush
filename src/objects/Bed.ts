import Phaser from 'phaser';
import { COLORS, DEPTH } from '@/ui/theme';
import type { Pet } from './Pet';

export type BedState = 'empty' | 'occupied' | 'treating' | 'done';

const BED_WIDTH = 200;
const BED_HEIGHT = 150;

export class Bed extends Phaser.GameObjects.Container {
  readonly index: number;
  private readonly art: Phaser.GameObjects.Image;
  private readonly highlight: Phaser.GameObjects.Image;
  private readonly arrow: Phaser.GameObjects.Image;
  private readonly check: Phaser.GameObjects.Image;
  private readonly scaleValue: number;
  private pet: Pet | null = null;
  private bedState: BedState = 'empty';
  private readonly bounds: Phaser.Geom.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, index: number, scale = 0.72) {
    super(scene, x, y);
    this.index = index;
    this.scaleValue = scale;
    this.setDepth(DEPTH.bed);

    this.highlight = scene.add
      .image(0, -BED_HEIGHT * 0.45 * scale, 'highlight')
      .setAlpha(0)
      .setScale(scale * 1.05);
    this.art = scene.add.image(0, 0, `bed-${index}`).setOrigin(0.5, 1).setScale(scale);
    this.arrow = scene.add
      .image(0, -(BED_HEIGHT * scale) - 56, 'arrow')
      .setScale(0.52)
      .setAlpha(0)
      .setTint(COLORS.pink);
    this.check = scene.add
      .image(0, -(BED_HEIGHT * scale) - 52, 'ui-check')
      .setScale(0.62)
      .setAlpha(0);

    this.bounds = new Phaser.Geom.Rectangle(
      x - (BED_WIDTH * scale) / 2,
      y - BED_HEIGHT * scale,
      BED_WIDTH * scale,
      BED_HEIGHT * scale,
    );

    this.add([this.highlight, this.art, this.arrow, this.check]);
    scene.add.existing(this);
    this.bob();
  }

  get bedStateValue(): BedState {
    return this.bedState;
  }

  get isFree(): boolean {
    return this.bedState === 'empty' && this.pet === null;
  }

  get currentPet(): Pet | null {
    return this.pet;
  }

  /** World position where a placed pet rests. */
  get petAnchor(): { x: number; y: number } {
    return { x: this.x, y: this.y - (BED_HEIGHT * this.scaleValue + 30) };
  }

  contains(x: number, y: number): boolean {
    const pad = 14;
    return (
      x >= this.bounds.x - pad &&
      x <= this.bounds.right + pad &&
      y >= this.bounds.y - pad &&
      y <= this.bounds.bottom + pad
    );
  }

  place(pet: Pet): void {
    this.pet = pet;
    this.bedState = 'occupied';
    const anchor = this.petAnchor;
    pet.setPosition(anchor.x, anchor.y);
    pet.setDepth(DEPTH.pet);
    pet.setHeld(false);
    pet.setScale(0.85);
    this.scene.tweens.add({
      targets: pet,
      scale: 1,
      duration: 260,
      ease: 'Back.easeOut',
    });
    this.setArrowVisible(true);
    this.setHighlight(false);
    this.setCheck(false);
  }

  setBedState(state: BedState): void {
    this.bedState = state;
    this.setHighlight(state === 'treating');
    this.setArrowVisible(state === 'occupied');
    this.setCheck(state === 'done');
  }

  markDone(): void {
    this.setBedState('done');
    this.scene.tweens.add({
      targets: this.check,
      scale: 0.8,
      duration: 220,
      ease: 'Back.easeOut',
      yoyo: false,
    });
  }

  clear(): void {
    this.pet = null;
    this.bedState = 'empty';
    this.setHighlight(false);
    this.setArrowVisible(false);
    this.setCheck(false);
  }

  setHighlight(on: boolean): void {
    this.scene.tweens.killTweensOf(this.highlight);
    this.scene.tweens.add({
      targets: this.highlight,
      alpha: on ? 1 : 0,
      duration: 180,
      ease: 'Sine.easeOut',
    });
  }

  setArrowVisible(visible: boolean): void {
    if (visible) {
      this.scene.tweens.add({
        targets: this.arrow,
        alpha: { from: 0, to: 0.9 },
        y: { from: this.arrow.y, to: this.arrow.y - 6 },
        yoyo: true,
        repeat: -1,
        duration: 620,
        ease: 'Sine.easeInOut',
      });
    } else {
      this.scene.tweens.killTweensOf(this.arrow);
      this.arrow.setAlpha(0);
    }
  }

  setCheck(on: boolean): void {
    this.check.setAlpha(on ? 1 : 0).setScale(on ? 0.62 : 0);
  }

  /** Rejection feedback: bed shakes and flashes when a drop is invalid. */
  reject(): void {
    this.scene.tweens.add({
      targets: this,
      x: { from: this.x, to: this.x + 10 },
      duration: 55,
      yoyo: true,
      repeat: 4,
      ease: 'Sine.easeInOut',
      onComplete: () => this.setX(this.bounds.x + (BED_WIDTH * this.scaleValue) / 2),
    });
    this.art.setTint(0xffb3b3);
    this.scene.time.delayedCall(240, () => this.art.clearTint());
  }

  /** Soft pulse used by the tutorial / first-time hint. */
  pulse(): void {
    this.scene.tweens.add({
      targets: this.art,
      scaleX: this.scaleValue * 1.04,
      scaleY: this.scaleValue * 1.04,
      duration: 160,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  private bob(): void {
    this.scene.tweens.add({
      targets: this.highlight,
      y: this.highlight.y - 4,
      yoyo: true,
      repeat: -1,
      duration: 1200,
      ease: 'Sine.easeInOut',
    });
  }
}

