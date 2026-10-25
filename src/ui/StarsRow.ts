import Phaser from 'phaser';

export class StarsRow extends Phaser.GameObjects.Container {
  private readonly stars: Phaser.GameObjects.Image[] = [];
  private readonly baseScale: number;
  private readonly size: number;
  private starCount = -1;

  constructor(scene: Phaser.Scene, x: number, y: number, size = 56, spacing = 12) {
    super(scene, x, y);
    this.size = size;
    this.baseScale = size / 64;
    for (let i = 0; i < 3; i += 1) {
      const star = scene.add
        .image((i - 1) * (size + spacing), 0, 'ui-star-empty')
        .setScale(this.baseScale);
      this.stars.push(star);
      this.add(star);
    }
    scene.add.existing(this);
  }

  setStars(count: number, animate = true): this {
    const clamped = Phaser.Math.Clamp(Math.round(count), 0, 3);
    if (clamped === this.starCount) return this;
    this.starCount = clamped;
    this.stars.forEach((star, index) => {
      star.setTexture(index < clamped ? 'ui-star' : 'ui-star-empty');
      star.setScale(this.baseScale);
      star.setAlpha(1);
      if (!animate || index >= clamped) return;
      star.setScale(0);
      this.scene.tweens.add({
        targets: star,
        scale: this.baseScale,
        duration: 300,
        delay: 180 + index * 170,
        ease: 'Back.easeOut',
      });
    });
    return this;
  }

  getStars(): number {
    return Math.max(0, this.starCount);
  }

  getSize(): number {
    return this.size;
  }
}
