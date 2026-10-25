import Phaser from 'phaser';

export const FONT_FAMILY = '"Baloo 2", "Fredoka", "Nunito", Arial, sans-serif';

export const COLORS = {
  ink: 0x4a3b53,
  inkSoft: 0x7c6b86,
  cream: 0xfff8ee,
  paper: 0xfffdf9,
  wall: 0xfff3e0,
  mint: 0x8ed6c4,
  mintDark: 0x69bda9,
  pink: 0xf79bb5,
  pinkDark: 0xd9778e,
  pinkLight: 0xffd6e1,
  blue: 0x9ed3f2,
  blueDark: 0x6fb6de,
  yellow: 0xffd166,
  coral: 0xff8a80,
  coralDark: 0xe06b62,
  lilac: 0xc9b6f2,
  green: 0x79c98b,
  red: 0xef6a6a,
  white: 0xffffff,
  shadow: 0x3a2b3e,
  panel: 0xfffdf9,
  panelAlt: 0xfff0e2,
} as const;

export const CSS = {
  ink: '#4a3b53',
  inkSoft: '#7c6b86',
  white: '#ffffff',
  cream: '#fff8ee',
  mint: '#8ed6c4',
  pink: '#f79bb5',
  coral: '#ff8a80',
  yellow: '#ffd166',
  green: '#79c98b',
  red: '#ef6a6a',
  blue: '#6fb6de',
} as const;

let fontPromise: Promise<void> | null = null;

export function loadGameFont(): Promise<void> {
  if (fontPromise) return fontPromise;
  fontPromise = (async () => {
    if (typeof FontFace === 'undefined' || typeof document === 'undefined') return;
    try {
      const face = new FontFace('Baloo 2', 'url("assets/fonts/Baloo2.ttf")', {
        weight: '200 800',
        display: 'swap',
      });
      await face.load();
      document.fonts.add(face);
      await document.fonts.ready;
    } catch (error) {
      console.warn('Baloo 2 font could not be loaded; using fallback.', error);
    }
  })();
  return fontPromise;
}

export function textStyle(
  size: number,
  color: string = CSS.ink,
  extra: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT_FAMILY,
    fontSize: `${size}px`,
    color,
    fontStyle: 'bold',
    align: 'center',
    ...extra,
  };
}

export function hex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

export function shade(color: number, amount: number): number {
  const c = Phaser.Display.Color.ValueToColor(color);
  const target = amount < 0 ? 0 : 255;
  const t = Math.abs(amount);
  return Phaser.Display.Color.GetColor(
    Math.round(Phaser.Math.Linear(c.red, target, t)),
    Math.round(Phaser.Math.Linear(c.green, target, t)),
    Math.round(Phaser.Math.Linear(c.blue, target, t)),
  );
}

export const DEPTH = {
  background: 0,
  furniture: 10,
  bed: 20,
  pet: 40,
  customer: 50,
  bubble: 70,
  overlay: 100,
  hud: 200,
  modal: 300,
  toast: 400,
} as const;
