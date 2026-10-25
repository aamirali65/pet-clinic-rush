import Phaser from 'phaser';
import { COLORS } from '@/ui/theme';

export class PatienceBar extends Phaser.GameObjects.Container {
  private readonly fill: Phaser.GameObjects.Graphics;
  private readonly widthValue: number;
  private ratio = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, width = 112) {
    super(scene, x, y);
    this.widthValue = width;
    const bg = scene.add.graphics();
    bg.fillStyle(0x4a3b53, 0.2);
    bg.fillRoundedRect(-width / 2, 0, width, 14, 7);
    bg.fillStyle(0xffffff, 0.55);
    bg.fillRoundedRect(-width / 2 + 2, 2, width - 4, 5, 3);
    this.add(bg);
    this.fill = scene.add.graphics();
    this.add(this.fill);
    this.draw();
    scene.add.existing(this);
  }

  setRatio(value: number): this {
    const next = Phaser.Math.Clamp(value, 0, 1);
    if (Math.abs(next - this.ratio) < 0.004) return this;
    this.ratio = next;
    this.draw();
    this.setAlpha(next < 0.25 ? 0.8 : 1);
    return this;
  }

  getRatio(): number {
    return this.ratio;
  }

  private draw(): void {
    const width = Math.max(0, this.widthValue * this.ratio);
    const color =
      this.ratio > 0.55 ? COLORS.green : this.ratio > 0.25 ? COLORS.yellow : COLORS.red;
    this.fill.clear();
    if (width > 2) {
      this.fill.fillStyle(color, 1);
      this.fill.fillRoundedRect(-this.widthValue / 2, 0, width, 14, 7);
      this.fill.fillStyle(0xffffff, 0.35);
      this.fill.fillRoundedRect(-this.widthValue / 2 + 2, 2, Math.max(0, width - 4), 5, 3);
    }
  }
}

