import Phaser from 'phaser';
import { COLORS, CSS, FONT_FAMILY, shade } from './theme';

export class Toggle extends Phaser.GameObjects.Container {
  private readonly track: Phaser.GameObjects.Graphics;
  private readonly knob: Phaser.GameObjects.Arc;
  private readonly widthValue: number;
  private value: boolean;
  private readonly onChange: (value: boolean) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    initial: boolean,
    onChange: (value: boolean) => void,
    width = 480,
  ) {
    super(scene, x, y);
    this.widthValue = width;
    this.value = initial;
    this.onChange = onChange;

    const labelText = scene.add
      .text(-width / 2 + 10, 0, label, {
        fontFamily: FONT_FAMILY,
        fontSize: '32px',
        fontStyle: 'bold',
        color: CSS.ink,
      })
      .setOrigin(0, 0.5);
    this.add(labelText);

    this.track = scene.add.graphics();
    this.add(this.track);

    const knobX = this.knobPosition();
    this.knob = scene.add.circle(knobX, 0, 22, 0xffffff);
    this.knob.setStrokeStyle(3, COLORS.shadow, 0.12);
    this.add(this.knob);

    this.drawTrack();
    this.setSize(width, 72);
    this.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, 72),
      Phaser.Geom.Rectangle.Contains,
    );
    this.input!.cursor = 'pointer';
    this.on('pointerup', () => {
      this.setValue(!this.value, true);
    });
    scene.add.existing(this);
  }

  getValue(): boolean {
    return this.value;
  }

  setValue(value: boolean, fire = false): this {
    if (this.value === value && fire) return this;
    this.value = value;
    this.drawTrack();
    this.scene.tweens.add({
      targets: this.knob,
      x: this.knobPosition(),
      duration: 160,
      ease: 'Back.easeOut',
    });
    if (fire) this.onChange(value);
    return this;
  }

  private knobPosition(): number {
    const center = this.widthValue / 2 - 48;
    return this.value ? center + 22 : center - 22;
  }

  private drawTrack(): void {
    const right = this.widthValue / 2;
    const x = right - 96;
    this.track.clear();
    this.track.fillStyle(COLORS.shadow, 0.15);
    this.track.fillRoundedRect(x, -24, 96, 52, 26);
    this.track.fillStyle(this.value ? COLORS.mint : COLORS.pinkLight, 1);
    this.track.fillRoundedRect(x, -28, 96, 52, 26);
    this.track.fillStyle(shade(this.value ? COLORS.mint : COLORS.pinkLight, -0.1), 1);
    this.track.fillRoundedRect(x + 4, 12, 88, 12, 6);
  }
}


