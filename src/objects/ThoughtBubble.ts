import Phaser from 'phaser';
import type { NeedKind } from '@/contracts/types';
import { DEPTH } from '@/ui/theme';

const NEED_EMOJI: Record<NeedKind, string> = {
  'need-fever': '🔥',
  'need-wound': '🩹',
  'need-dirty': '🧽',
  'need-hungry': '🍲',
  'need-itchy': '💧',
  'need-sad': '😢',
  'need-sleepy': '😴',
};

export class ThoughtBubble extends Phaser.GameObjects.Container {
  private emojis = new Map<NeedKind, Phaser.GameObjects.Text>();
  private checks = new Map<NeedKind, Phaser.GameObjects.Image>();
  private needs: NeedKind[] = [];
  private baseScale = 0.8;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.setDepth(DEPTH.bubble);
    const bubble = scene.add.image(0, 0, 'bubble').setOrigin(0.5);
    this.add(bubble);
    scene.add.existing(this);
  }

  setNeeds(needs: NeedKind[]): this {
    for (const emoji of this.emojis.values()) emoji.destroy();
    for (const check of this.checks.values()) check.destroy();
    this.emojis.clear();
    this.checks.clear();
    this.needs = [...needs].slice(0, 4);
    const positions = this.needs.length <= 2
      ? [[0, 0], [0, -30]]
      : this.needs.length === 3
        ? [[ -25, -25], [0, -25], [25, -25]]
        : [[ -35, -35], [0, -35], [35, -35], [0, -35]];
    this.needs.forEach((need, index) => {
      const emojiChar = NEED_EMOJI[need] ?? '❓';
      const emoji = this.scene.add
        .text(positions[index][0], positions[index][1], emojiChar, {
          fontFamily: 'Baloo 2',
          fontSize: 48,
          color: '#3a2b3e',
        })
        .setOrigin(0.5);
      this.add(emoji);
      this.emojis.set(need, emoji);

      const check = this.scene.add
        .image(0, 0, 'ui-check')
        .setDisplaySize(24, 24)
        .setAlpha(0)
        .setScale(0)
        .setOrigin(0.5);
      this.add(check);
      this.checks.set(need, check);
    });
    return this;
  }

  markDone(need: NeedKind): this {
    const emoji = this.emojis.get(need);
    if (!emoji) return this;
    emoji.setColor('#d9778e');
    const check = this.checks.get(need);
    if (check) {
      check.setAlpha(1);
      this.scene.tweens.add({
        targets: check,
        scale: 1,
        duration: 220,
        ease: 'Back.easeOut',
      });
    }
    return this;
  }

  setBubbleScale(value: number): this {
    this.baseScale = value;
    this.setScale(value);
    return this;
  }

  pop(): this {
    this.setScale(this.baseScale * 0.8);
    this.scene.tweens.add({
      targets: this,
      scale: this.baseScale,
      duration: 240,
      ease: 'Back.easeOut',
    });
    return this;
  }
}