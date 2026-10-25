import Phaser from 'phaser';
import { COLORS, CSS, FONT_FAMILY, shade } from './theme';

export interface PanelOptions {
  color?: number;
  radius?: number;
  shadow?: boolean;
  border?: number | null;
  title?: string;
  titleColor?: string;
  titleSize?: number;
}

export class Panel extends Phaser.GameObjects.Container {
  readonly content: Phaser.GameObjects.Container;
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly panelWidth: number;
  private readonly panelHeight: number;
  private readonly options: PanelOptions;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    options: PanelOptions = {},
  ) {
    super(scene, x, y);
    this.panelWidth = width;
    this.panelHeight = height;
    this.options = options;
    this.bg = scene.add.graphics();
    this.add(this.bg);
    this.content = scene.add.container(0, 0);
    this.add(this.content);

    this.draw();

    if (options.title) {
      const title = scene.add
        .text(0, -height / 2 + 34, options.title, {
          fontFamily: FONT_FAMILY,
          fontSize: `${options.titleSize ?? 38}px`,
          fontStyle: 'bold',
          color: options.titleColor ?? CSS.ink,
        })
        .setOrigin(0.5);
      this.content.add(title);
    }

    scene.add.existing(this);
  }

  setPanelColor(color: number): this {
    this.options.color = color;
    this.draw();
    return this;
  }

  private draw(): void {
    const w = this.panelWidth;
    const h = this.panelHeight;
    const radius = this.options.radius ?? 32;
    const color = this.options.color ?? COLORS.panel;
    const x = -w / 2;
    const y = -h / 2;

    this.bg.clear();
    if (this.options.shadow !== false) {
      this.bg.fillStyle(COLORS.shadow, 0.18);
      this.bg.fillRoundedRect(x + 2, y + 10, w, h, radius);
    }
    this.bg.fillStyle(shade(color, -0.12), 1);
    this.bg.fillRoundedRect(x, y, w, h, radius);
    this.bg.fillStyle(color, 1);
    this.bg.fillRoundedRect(x + 3, y + 3, w - 6, h - 8, radius - 3);
    this.bg.fillStyle(0xffffff, 0.4);
    this.bg.fillRoundedRect(x + w * 0.1, y + 8, w * 0.8, 12, 6);
    if (this.options.border != null) {
      this.bg.lineStyle(4, this.options.border, 0.8);
      this.bg.strokeRoundedRect(x + 3, y + 3, w - 6, h - 8, radius - 3);
    }
  }
}

export function addDim(scene: Phaser.Scene, alpha = 0.55): Phaser.GameObjects.Rectangle {
  return scene.add
    .rectangle(360, 640, 720, 1280, 0x2c2233, alpha)
    .setInteractive()
    .setDepth(0);
}
