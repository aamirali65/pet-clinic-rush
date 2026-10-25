import Phaser from 'phaser';
import { Button } from './Button';
import { Panel } from './Panel';
import { COLORS, DEPTH } from './theme';

export class Modal extends Phaser.GameObjects.Container {
  readonly content: Phaser.GameObjects.Container;
  private readonly panel: Panel;
  private readonly backdrop: Phaser.GameObjects.Rectangle;
  private readonly onClose: (() => void) | undefined;

  constructor(
    scene: Phaser.Scene,
    title: string,
    width = 600,
    height = 720,
    onClose?: () => void,
  ) {
    super(scene, 0, 0);
    this.onClose = onClose;
    this.setDepth(DEPTH.modal);

    this.backdrop = scene.add
      .rectangle(360, 640, 720, 1280, 0x2c2233, 0.6)
      .setInteractive();
    this.add(this.backdrop);

    this.panel = new Panel(scene, 360, 640, width, height, {
      title,
      radius: 40,
      color: COLORS.panel,
    });
    this.add(this.panel);

    this.content = this.panel.content;

    const close = new Button(scene, width / 2 - 42, -height / 2 + 38, {
      label: '',
      width: 64,
      height: 64,
      radius: 32,
      color: COLORS.coral,
      icon: 'ui-cross',
      iconScale: 0.6,
      fontSize: 26,
      onClick: () => this.close(),
    });
    this.content.add(close);

    this.backdrop.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const bounds = this.panel.getBounds();
      if (!bounds.contains(pointer.x, pointer.y)) this.close();
    });
    scene.add.existing(this);
    this.setAlpha(0);
    scene.tweens.add({ targets: this, alpha: 1, duration: 180 });
    this.panel.setScale(0.92);
    scene.tweens.add({
      targets: this.panel,
      scaleX: 1,
      scaleY: 1,
      duration: 260,
      ease: 'Back.easeOut',
    });
  }

  close(): void {
    if (!this.active) return;
    this.onClose?.();
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 150,
      onComplete: () => this.destroy(),
    });
  }

  destroy(fromScene?: boolean): void {
    this.backdrop.removeAllListeners();
    super.destroy(fromScene);
  }
}

