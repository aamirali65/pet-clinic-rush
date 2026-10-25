import Phaser from 'phaser';
import type { ToolKind } from '@/contracts/types';
import { Button } from './Button';
import { Panel } from './Panel';
import { COLORS, CSS, FONT_FAMILY } from './theme';

const TOOLS: Array<{ key: ToolKind; label: string }> = [
  { key: 'tool-thermometer', label: 'Thermo' },
  { key: 'tool-medicine', label: 'Medicine' },
  { key: 'tool-bandage', label: 'Bandage' },
  { key: 'tool-sponge', label: 'Sponge' },
  { key: 'tool-rinse', label: 'Rinse' },
  { key: 'tool-food', label: 'Food' },
  { key: 'tool-brush', label: 'Brush' },
  { key: 'tool-heart', label: 'Love' },
  { key: 'tool-pillow', label: 'Pillow' },
];

export class ToolTray extends Phaser.GameObjects.Container {
  private open = false;
  private readonly onSelect: (tool: ToolKind) => void;
  private readonly onClose: () => void;

  constructor(
    scene: Phaser.Scene,
    onSelect: (tool: ToolKind) => void,
    onClose: () => void,
  ) {
    super(scene, 360, 1500);
    this.onSelect = onSelect;
    this.onClose = onClose;

    const blocker = scene.add
      .rectangle(0, 0, 720, 400, 0x2c2233, 0.1)
      .setInteractive();
    const panel = new Panel(scene, 0, 0, 720, 380, {
      color: COLORS.panel,
      radius: 38,
      border: COLORS.pinkLight,
    });
    const title = scene.add
      .text(-340, -140, 'Pick the right tool', {
        fontFamily: FONT_FAMILY,
        fontSize: '34px',
        fontStyle: 'bold',
        color: CSS.ink,
      })
      .setOrigin(0, 0.5);
    const close = new Button(scene, 340, -140, {
      label: '',
      width: 64,
      height: 64,
      radius: 32,
      color: COLORS.coral,
      icon: 'ui-cross',
      iconScale: 0.8,
      onClick: () => this.hide(),
    });

    this.add([blocker, panel, title, close]);

    const positions = [
      [-336, -56],
      [-202, -56],
      [-68, -56],
      [66, -56],
      [200, -56],
      [-238, 52],
      [-104, 52],
      [30, 52],
      [164, 52],
    ];

    TOOLS.forEach((tool, index) => {
      const pos = positions[index] ?? [0, 0];
      const item = scene.add.container(pos[0]!, pos[1]!);
      const shadow = scene.add.circle(0, 6, 45, COLORS.shadow, 0.2);
      const circle = scene.add.circle(0, 0, 44, COLORS.pinkLight);
      const circleTop = scene.add.circle(0, -2, 36, 0xffffff, 0.4);
      const icon = scene.add.image(0, 0, tool.key).setDisplaySize(68, 68);
      const label = scene.add
        .text(0, 65, tool.label, {
          fontFamily: FONT_FAMILY,
          fontSize: '18px',
          fontStyle: 'bold',
          color: CSS.inkSoft,
        })
        .setOrigin(0.5);
      item.add([shadow, circle, circleTop, icon, label]);
      item.setSize(136, 136);
      item.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, 136, 136),
        Phaser.Geom.Rectangle.Contains,
      );
      item.input!.cursor = 'pointer';
      item.on('pointerdown', () => {
        scene.tweens.add({ targets: item, scale: 0.95, duration: 80, yoyo: true });
      });
      item.on('pointerup', () => {
        if (!this.open) return;
        this.onSelect(tool.key);
      });
      this.add(item);
    });

    this.setDepth(95);
    this.setVisible(false);
    scene.add.existing(this);
  }

  show(): void {
    if (this.open) return;
    this.open = true;
    this.setVisible(true);
    this.setY(1500);
    this.scene.tweens.add({
      targets: this,
      y: 1084,
      duration: 280,
      ease: 'Back.easeOut',
    });
  }

  hide(): void {
    if (!this.open) return;
    this.open = false;
    this.scene.tweens.add({
      targets: this,
      y: 1500,
      duration: 200,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.setVisible(false);
        this.onClose();
      },
    });
  }

  get isOpen(): boolean {
    return this.open;
  }
}

