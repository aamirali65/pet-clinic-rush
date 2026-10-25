import Phaser from 'phaser';
import { COLORS, CSS, FONT_FAMILY, shade } from './theme';

export interface ButtonOptions {
  label: string;
  width?: number;
  height?: number;
  color?: number;
  textColor?: string;
  fontSize?: number;
  icon?: string;
  iconScale?: number;
  radius?: number;
  enabled?: boolean;
  onClick?: () => void;
}

export class Button extends Phaser.GameObjects.Container {
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly iconImage: Phaser.GameObjects.Image | null;
  private readonly buttonWidth: number;
  private readonly buttonHeight: number;
  private baseColor: number;
  private readonly radius: number;
  private onClick: (() => void) | undefined;
  private enabled: boolean;
  private pressed = false;
  private hovered = false;

  constructor(scene: Phaser.Scene, x: number, y: number, options: ButtonOptions) {
    super(scene, x, y);
    this.buttonWidth = options.width ?? 300;
    this.buttonHeight = options.height ?? 88;
    this.baseColor = options.color ?? COLORS.mint;
    this.radius = options.radius ?? 26;
    this.enabled = options.enabled ?? true;
    this.onClick = options.onClick;

    this.bg = scene.add.graphics();
    this.add(this.bg);

    this.iconImage = options.icon
      ? scene.add
          .image(0, 1, options.icon)
          .setDisplaySize(34 * (options.iconScale ?? 1), 34 * (options.iconScale ?? 1))
          .setTint(0xffffff)
      : null;
    if (this.iconImage) this.add(this.iconImage);

    const fontSize = options.fontSize ?? Math.round(this.buttonHeight * 0.4);
    const textOffset = this.iconImage ? 20 : 0;
    this.label = scene.add
      .text(textOffset, 1, options.label, {
        fontFamily: FONT_FAMILY,
        fontSize: `${fontSize}px`,
        fontStyle: 'bold',
        color: options.textColor ?? CSS.white,
      })
      .setOrigin(0.5);
    this.add(this.label);

    this.draw();
    this.layout();
    this.setSize(this.buttonWidth, this.buttonHeight);
    this.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, this.buttonWidth, this.buttonHeight),
      Phaser.Geom.Rectangle.Contains,
    );
    this.input!.cursor = 'pointer';

    this.on('pointerdown', this.handleDown, this);
    this.on('pointerup', this.handleUp, this);
    this.on('pointerupoutside', this.handleUpOutside, this);
    this.on('pointerover', this.handleOver, this);
    this.on('pointerout', this.handleOut, this);
    this.on('destroy', this.handleDestroy, this);

    this.setEnabled(this.enabled);
    scene.add.existing(this);
  }

  setText(value: string): this {
    this.label.setText(value);
    this.layout();
    return this;
  }

  setOnClick(handler: () => void): this {
    this.onClick = handler;
    return this;
  }

  setEnabled(value: boolean): this {
    this.enabled = value;
    this.setAlpha(value ? 1 : 0.45);
    if (this.input) this.input.enabled = value;
    return this;
  }

  setTextColor(color: string): this {
    this.label.setColor(color);
    return this;
  }

  setButtonColor(color: number): this {
    if (color === this.baseColor) return this;
    this.baseColor = color;
    this.draw();
    return this;
  }

  private draw(): void {
    const w = this.buttonWidth;
    const h = this.buttonHeight;
    const x = -w / 2;
    const y = -h / 2;
    this.bg.clear();
    this.bg.fillStyle(COLORS.shadow, 0.22);
    this.bg.fillRoundedRect(x, y + 8, w, h, this.radius);
    this.bg.fillStyle(shade(this.baseColor, -0.18), 1);
    this.bg.fillRoundedRect(x, y, w, h, this.radius);
    this.bg.fillStyle(this.baseColor, 1);
    this.bg.fillRoundedRect(x + 3, y + 2, w - 6, h - 8, this.radius - 3);
    this.bg.fillStyle(0xffffff, 0.2);
    this.bg.fillRoundedRect(x + w * 0.12, y + 7, w * 0.76, Math.max(10, h * 0.2), 8);
  }

  private layout(): void {
    if (!this.iconImage) {
      this.label.setX(0);
      return;
    }
    const total = this.iconImage.displayWidth + 12 + this.label.width;
    const left = -total / 2;
    this.iconImage.setX(left + this.iconImage.displayWidth / 2);
    this.label.setX(left + this.iconImage.displayWidth + 12 + this.label.width / 2);
  }

  private handleDown(): void {
    if (!this.enabled) return;
    this.pressed = true;
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.94,
      scaleY: 0.94,
      duration: 70,
      ease: 'Quad.easeOut',
    });
  }

  private handleUp(): void {
    if (!this.pressed) return;
    this.pressed = false;
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 120,
      ease: 'Back.easeOut',
    });
    if (this.enabled) this.onClick?.();
  }

  private handleUpOutside(): void {
    this.pressed = false;
    this.scene.tweens.add({ targets: this, scaleX: 1, scaleY: 1, duration: 100 });
  }

  private handleOver(): void {
    if (!this.enabled || this.hovered) return;
    this.hovered = true;
    this.scene.tweens.add({ targets: this, scaleX: 1.03, scaleY: 1.03, duration: 100 });
  }

  private handleOut(): void {
    this.hovered = false;
    if (!this.pressed) this.scene.tweens.add({ targets: this, scaleX: 1, scaleY: 1, duration: 100 });
  }

  private handleDestroy(): void {
    this.off('pointerdown', this.handleDown, this);
    this.off('pointerup', this.handleUp, this);
    this.off('pointerupoutside', this.handleUpOutside, this);
    this.off('pointerover', this.handleOver, this);
    this.off('pointerout', this.handleOut, this);
    this.off('destroy', this.handleDestroy, this);
  }
}




