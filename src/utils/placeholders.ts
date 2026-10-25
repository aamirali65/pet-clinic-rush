import Phaser from 'phaser';

export const PET_KINDS = ['cat', 'dog', 'rabbit', 'hamster', 'bird', 'turtle'] as const;
export type PetKind = (typeof PET_KINDS)[number];

export const PET_MOODS = ['idle', 'sick', 'happy'] as const;
export type PetMood = (typeof PET_MOODS)[number];

export const CUSTOMER_COUNT = 8;

export function petTextureKey(kind: PetKind, mood: PetMood = 'idle'): string {
  return `pet-${kind}-${mood}`;
}

export function customerTextureKey(index: number): string {
  return `customer-${index % CUSTOMER_COUNT}`;
}

export function bedTextureKey(index: number): string {
  return `bed-${index % 5}`;
}

export const NEED_KEYS = [
  'need-fever',
  'need-wound',
  'need-dirty',
  'need-hungry',
  'need-itchy',
  'need-sad',
  'need-sleepy',
] as const;
export type NeedTextureKey = (typeof NEED_KEYS)[number];

export const TOOL_KEYS = [
  'tool-thermometer',
  'tool-medicine',
  'tool-bandage',
  'tool-sponge',
  'tool-rinse',
  'tool-food',
  'tool-brush',
  'tool-heart',
  'tool-pillow',
] as const;

const C = {
  ink: 0x4a3b53,
  cream: 0xfff8ee,
  wallTop: 0xfff3e0,
  wallBottom: 0xf6e2ca,
  floorA: 0xf3dcba,
  floorB: 0xeed2a9,
  mint: 0x8ed6c4,
  mintDark: 0x69bda9,
  pink: 0xf79bb5,
  pinkLight: 0xffc2d2,
  blue: 0x9ed3f2,
  blueDark: 0x6fb6de,
  yellow: 0xffd166,
  coral: 0xff8a80,
  lilac: 0xc9b6f2,
  wood: 0xd9b48f,
  woodDark: 0xb98d68,
  white: 0xffffff,
  red: 0xef6a6a,
  green: 0x79c98b,
} as const;

type G = Phaser.GameObjects.Graphics;

function make(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (g: G) => void,
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.setVisible(false);
  try {
    draw(g);
    g.generateTexture(key, width, height);
  } finally {
    g.destroy();
  }
}

function starPoints(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  points = 5,
): Phaser.Geom.Point[] {
  const out: Phaser.Geom.Point[] = [];
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    out.push(new Phaser.Geom.Point(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius));
  }
  return out;
}

function heartPoints(cx: number, cy: number, scale: number): Phaser.Geom.Point[] {
  const pts: Phaser.Geom.Point[] = [];
  const steps = 48;
  for (let i = 0; i < steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push(new Phaser.Geom.Point(cx + (x * scale) / 16, cy + (y * scale) / 16));
  }
  return pts;
}

function drawHeart(g: G, cx: number, cy: number, scale: number, color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.fillPoints(heartPoints(cx, cy, scale), true);
}

function drawStar(
  g: G,
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  color: number,
  alpha = 1,
): void {
  g.fillStyle(color, alpha);
  g.fillPoints(starPoints(cx, cy, outer, inner), true);
}

function drawPaw(g: G, cx: number, cy: number, scale: number, color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.fillEllipse(cx, cy + 6 * scale, 24 * scale, 20 * scale);
  g.fillCircle(cx - 13 * scale, cy - 4 * scale, 5.5 * scale);
  g.fillCircle(cx - 5 * scale, cy - 12 * scale, 6 * scale);
  g.fillCircle(cx + 5 * scale, cy - 12 * scale, 6 * scale);
  g.fillCircle(cx + 13 * scale, cy - 4 * scale, 5.5 * scale);
}

function drawDrop(g: G, cx: number, cy: number, scale: number, color: number): void {
  g.fillStyle(color, 0.9);
  g.fillCircle(cx, cy + 4 * scale, 5 * scale);
  g.fillTriangle(
    cx - 4.2 * scale,
    cy + 2 * scale,
    cx + 4.2 * scale,
    cy + 2 * scale,
    cx,
    cy - 8 * scale,
  );
}

function eyeHappy(g: G, x: number, y: number, color = C.ink): void {
  g.lineStyle(3.5, color, 1);
  g.beginPath();
  g.arc(x, y + 2, 7, Math.PI * 1.08, Math.PI * 1.92, false);
  g.strokePath();
}

function eyeSick(g: G, x: number, y: number, color = C.ink): void {
  g.lineStyle(3.5, color, 1);
  g.beginPath();
  g.arc(x, y + 4, 6, Math.PI * 1.12, Math.PI * 1.88, false);
  g.strokePath();
  g.fillStyle(color, 1);
  g.fillCircle(x, y + 5, 2);
}

function eyeOpen(g: G, x: number, y: number, color = C.ink): void {
  g.fillStyle(color, 1);
  g.fillCircle(x, y, 5.2);
  g.fillStyle(C.white, 1);
  g.fillCircle(x - 1.8, y - 2, 1.8);
}

function smile(g: G, x: number, y: number, width: number, color = C.ink): void {
  g.lineStyle(3.2, color, 1);
  g.beginPath();
  g.arc(x, y - width * 0.25, width * 0.5, Math.PI * 0.18, Math.PI * 0.82, false);
  g.strokePath();
}

function drawPet(scene: Phaser.Scene, kind: PetKind, mood: PetMood): void {
  const key = petTextureKey(kind, mood);
  make(scene, key, 160, 160, (g) => {
    let body: number = 0xf6a65d;
    let dark: number = 0xd97c3f;
    let light: number = 0xffe3c2;
    let inner: number = C.pinkLight;

    if (kind === 'dog') {
      body = 0xc98b62;
      dark = 0x9c6747;
      light = 0xf6dfc8;
      inner = 0xf3c9b0;
    } else if (kind === 'rabbit') {
      body = 0xe9e2ef;
      dark = 0xc9bdd8;
      light = 0xffffff;
      inner = C.pinkLight;
    } else if (kind === 'hamster') {
      body = 0xf2c879;
      dark = 0xd9a94f;
      light = 0xfff0cc;
      inner = C.pinkLight;
    } else if (kind === 'bird') {
      body = 0xffd166;
      dark = 0xe4b13f;
      light = 0xfff0b8;
      inner = C.coral;
    } else if (kind === 'turtle') {
      body = 0xa8d5a2;
      dark = 0x6aab72;
      light = 0xd7f0d1;
      inner = 0xf2c9a0;
    }

    // Shadow under the pet is a separate object; keep the texture tight.
    // Tail / back details.
    if (kind === 'cat') {
      g.lineStyle(11, body, 1);
      g.beginPath();
      g.moveTo(118, 112);
      g.lineTo(136, 92);
      g.lineTo(132, 74);
      g.strokePath();
      g.fillStyle(dark, 1);
      g.fillCircle(132, 74, 6);
      g.lineStyle(3, dark, 1);
      g.beginPath();
      g.moveTo(126, 104);
      g.lineTo(134, 96);
      g.strokePath();
    } else if (kind === 'dog') {
      g.fillStyle(dark, 1);
      g.fillEllipse(132, 104, 20, 26);
    } else if (kind === 'hamster' || kind === 'rabbit') {
      g.fillStyle(body, 1);
      g.fillCircle(130, 112, 13);
    } else if (kind === 'bird') {
      g.fillStyle(dark, 1);
      g.fillTriangle(114, 116, 142, 106, 128, 130);
    } else if (kind === 'turtle') {
      g.fillStyle(body, 1);
      g.fillTriangle(124, 116, 142, 124, 126, 132);
    }

    if (kind === 'turtle') {
      // Legs.
      g.fillStyle(body, 1);
      g.fillEllipse(52, 136, 22, 16);
      g.fillEllipse(108, 136, 22, 16);
      // Shell.
      g.fillStyle(dark, 1);
      g.fillEllipse(80, 110, 102, 72);
      g.fillStyle(body, 1);
      g.fillEllipse(80, 112, 88, 58);
      g.lineStyle(3, C.green, 0.55);
      g.strokeEllipse(80, 112, 62, 40);
      g.strokeEllipse(80, 112, 30, 18);
      g.beginPath();
      g.moveTo(80, 84);
      g.lineTo(80, 140);
      g.moveTo(48, 100);
      g.lineTo(112, 124);
      g.moveTo(112, 100);
      g.lineTo(48, 124);
      g.strokePath();
      // Head.
      g.fillStyle(body, 1);
      g.fillCircle(80, 62, 27);
      g.fillStyle(light, 0.7);
      g.fillEllipse(80, 50, 16, 10);
    } else {
      // Body.
      if (kind === 'bird') {
        g.fillStyle(body, 1);
        g.fillEllipse(80, 108, 74, 78);
        g.fillStyle(light, 0.85);
        g.fillEllipse(80, 120, 40, 34);
        g.fillStyle(dark, 1);
        g.fillEllipse(112, 110, 22, 36);
      } else {
        g.fillStyle(body, 1);
        g.fillEllipse(80, 114, 94, 70);
        g.fillStyle(light, 0.9);
        g.fillEllipse(80, 124, 54, 38);
        // Paws.
        g.fillStyle(light, 1);
        g.fillEllipse(58, 142, 22, 13);
        g.fillEllipse(102, 142, 22, 13);
      }
    }

    // Ears behind the head.
    if (kind === 'cat') {
      g.fillStyle(body, 1);
      g.fillTriangle(44, 52, 60, 12, 78, 44);
      g.fillTriangle(116, 52, 100, 12, 82, 44);
      g.fillStyle(inner, 1);
      g.fillTriangle(52, 44, 61, 24, 70, 40);
      g.fillTriangle(108, 44, 99, 24, 90, 40);
    } else if (kind === 'dog') {
      g.fillStyle(dark, 1);
      g.fillEllipse(43, 70, 24, 46);
      g.fillEllipse(117, 70, 24, 46);
      g.fillStyle(inner, 0.6);
      g.fillEllipse(43, 74, 12, 28);
      g.fillEllipse(117, 74, 12, 28);
    } else if (kind === 'rabbit') {
      g.fillStyle(body, 1);
      g.fillEllipse(58, 26, 20, 52);
      g.fillEllipse(102, 26, 20, 52);
      g.fillStyle(inner, 0.9);
      g.fillEllipse(58, 27, 10, 36);
      g.fillEllipse(102, 27, 10, 36);
    } else if (kind === 'hamster') {
      g.fillStyle(body, 1);
      g.fillCircle(50, 42, 15);
      g.fillCircle(110, 42, 15);
      g.fillStyle(inner, 0.9);
      g.fillCircle(50, 42, 8);
      g.fillCircle(110, 42, 8);
    } else if (kind === 'bird') {
      g.fillStyle(dark, 1);
      g.fillTriangle(74, 36, 80, 14, 86, 36);
      g.fillTriangle(64, 40, 72, 22, 78, 40);
    }

    // Head.
    if (kind === 'turtle' || kind === 'bird') {
      g.fillStyle(body, 1);
      g.fillCircle(80, 62, kind === 'turtle' ? 27 : 34);
      g.fillStyle(light, 0.55);
      g.fillEllipse(80, 48, kind === 'turtle' ? 16 : 24, 10);
    } else {
      g.fillStyle(body, 1);
      g.fillCircle(80, 68, 39);
      g.fillStyle(light, 0.35);
      g.fillEllipse(80, 50, 34, 16);
    }

    if (kind === 'dog') {
      g.fillStyle(dark, 0.85);
      g.fillEllipse(62, 58, 24, 20);
    }
    if (kind === 'cat') {
      g.lineStyle(3, dark, 0.7);
      g.beginPath();
      g.moveTo(80, 40);
      g.lineTo(80, 50);
      g.moveTo(70, 43);
      g.lineTo(74, 52);
      g.moveTo(90, 43);
      g.lineTo(86, 52);
      g.strokePath();
    }

    // Face.
    const eyeY = kind === 'bird' || kind === 'turtle' ? 58 : 64;
    const eyeLX = kind === 'bird' || kind === 'turtle' ? 68 : 66;
    const eyeRX = kind === 'bird' || kind === 'turtle' ? 92 : 94;
    if (mood === 'happy') {
      eyeHappy(g, eyeLX, eyeY);
      eyeHappy(g, eyeRX, eyeY);
    } else if (mood === 'sick') {
      eyeSick(g, eyeLX, eyeY);
      eyeSick(g, eyeRX, eyeY);
      drawDrop(g, 120, 46, 1, 0x7cc7f2);
      drawDrop(g, 40, 52, 0.7, 0x7cc7f2);
    } else {
      eyeOpen(g, eyeLX, eyeY);
      eyeOpen(g, eyeRX, eyeY);
    }

    // Nose and mouth.
    if (kind === 'bird') {
      g.fillStyle(inner, 1);
      g.fillTriangle(68, 68, 92, 68, 80, 84);
      g.lineStyle(2, C.ink, 0.5);
      g.beginPath();
      g.moveTo(68, 68);
      g.lineTo(80, 74);
      g.lineTo(92, 68);
      g.strokePath();
    } else if (kind === 'turtle') {
      g.fillStyle(C.ink, 1);
      g.fillCircle(72, 68, 2);
      g.fillCircle(88, 68, 2);
      smile(g, 80, 76, 14);
    } else {
      if (kind === 'dog') {
        g.fillStyle(C.ink, 1);
        g.fillEllipse(80, 78, 11, 8);
      } else {
        g.fillStyle(C.pink, 1);
        g.fillTriangle(73, 76, 87, 76, 80, 84);
      }
      if (mood === 'happy') {
        g.fillStyle(0x8e3b4a, 1);
        g.fillEllipse(80, 92, 18, 11);
        g.fillStyle(C.pinkLight, 1);
        g.fillEllipse(80, 95, 9, 5);
      } else if (mood === 'sick') {
        g.lineStyle(2.5, C.ink, 1);
        g.beginPath();
        g.moveTo(72, 92);
        g.lineTo(78, 89);
        g.lineTo(84, 93);
        g.lineTo(90, 90);
        g.strokePath();
      } else {
        smile(g, 80, 84, kind === 'hamster' ? 18 : 15);
        if (kind === 'hamster') {
          g.fillStyle(C.white, 1);
          g.fillRect(77, 86, 3, 6);
          g.fillRect(81, 86, 3, 6);
        }
      }
    }

    // Blush.
    g.fillStyle(C.pink, mood === 'sick' ? 0.25 : 0.4);
    g.fillCircle(kind === 'turtle' || kind === 'bird' ? 54 : 48, 78, 7);
    g.fillCircle(kind === 'turtle' || kind === 'bird' ? 106 : 112, 78, 7);

    if (mood === 'happy') {
      drawStar(g, 26, 34, 5, 2, C.yellow);
      drawStar(g, 136, 48, 4, 1.7, C.yellow);
    }
  });
}

function drawCustomer(scene: Phaser.Scene, index: number): void {
  const skins = [0xffd9b8, 0xf2c29b, 0xc68a63, 0x8d5524, 0xffe0bd, 0xe0ac69, 0xf5cba7, 0xa86b3f];
  const hairs = [0x3b2a25, 0x6b3e26, 0xe6b85c, 0x2b2b2b, 0xb05c3b, 0x8e5ac8, 0x2e6f95, 0xd9774f];
  const shirts = [
    0xff9aa2, 0x8ecae6, 0xffd166, 0xb8e0c2, 0xc9b6f2, 0xffb4a2, 0x9bd4c1, 0xf7a8c4,
  ];
  const pants = [0x5b7db1, 0x4a4a5a, 0x7a6a58, 0x6c8ebf, 0x896a9e, 0x4f7f73, 0xb06a6a, 0x5c6b8a];
  const skin = skins[index % skins.length];
  const hair = hairs[index % hairs.length];
  const shirt = shirts[index % shirts.length];
  const trouser = pants[index % pants.length];
  const style = index % 8;

  make(scene, customerTextureKey(index), 160, 250, (g) => {
    // Back hair.
    if (style === 1 || style === 4) {
      g.fillStyle(hair, 1);
      g.fillRoundedRect(33, 44, 94, 104, 38);
    }
    if (style === 6) {
      g.fillStyle(hair, 1);
      g.fillCircle(124, 64, 20);
      g.fillCircle(130, 88, 14);
    }
    if (style === 2) {
      g.fillStyle(hair, 1);
      g.fillCircle(80, 28, 19);
    }

    // Legs and shoes.
    g.fillStyle(trouser, 1);
    g.fillRoundedRect(56, 172, 22, 52, 9);
    g.fillRoundedRect(84, 172, 22, 52, 9);
    g.fillStyle(C.ink, 1);
    g.fillRoundedRect(50, 220, 32, 18, 8);
    g.fillRoundedRect(80, 220, 32, 18, 8);

    // Body.
    g.fillStyle(shirt, 1);
    g.fillRoundedRect(43, 118, 74, 76, 24);
    g.fillStyle(C.white, 0.35);
    g.fillEllipse(80, 142, 44, 20);
    g.fillStyle(shirt, 1);
    g.fillRoundedRect(36, 126, 16, 62, 8);
    g.fillRoundedRect(108, 126, 16, 62, 8);
    g.fillStyle(skin, 1);
    g.fillCircle(44, 196, 10);
    g.fillCircle(116, 196, 10);

    // Neck and head.
    g.fillStyle(skin, 1);
    g.fillRoundedRect(68, 100, 24, 26, 8);
    g.fillCircle(80, 80, 39);

    // Hair front.
    g.fillStyle(hair, 1);
    if (style === 0) {
      g.beginPath();
      g.arc(80, 78, 40, Math.PI * 1.02, Math.PI * 1.98, false);
      g.fillPath();
      g.fillRoundedRect(46, 46, 68, 16, 8);
    } else if (style === 1) {
      g.beginPath();
      g.arc(80, 76, 41, Math.PI * 1.0, Math.PI * 2.0, false);
      g.fillPath();
      g.fillRoundedRect(40, 58, 16, 58, 8);
      g.fillRoundedRect(104, 58, 16, 58, 8);
    } else if (style === 2) {
      g.beginPath();
      g.arc(80, 76, 41, Math.PI * 1.02, Math.PI * 1.98, false);
      g.fillPath();
      g.fillCircle(80, 28, 19);
    } else if (style === 3) {
      g.fillStyle(0x4f7f73, 1);
      g.beginPath();
      g.arc(80, 74, 43, Math.PI, Math.PI * 2, false);
      g.fillPath();
      g.fillRoundedRect(36, 69, 88, 12, 6);
    } else if (style === 4) {
      g.beginPath();
      g.arc(80, 78, 40, Math.PI * 1.0, Math.PI * 2.0, false);
      g.fillPath();
      g.fillRoundedRect(36, 62, 18, 94, 9);
      g.fillRoundedRect(106, 62, 18, 94, 9);
    } else if (style === 5) {
      g.fillCircle(56, 52, 18);
      g.fillCircle(80, 42, 20);
      g.fillCircle(104, 52, 18);
      g.fillCircle(44, 72, 13);
      g.fillCircle(116, 72, 13);
    } else if (style === 6) {
      g.beginPath();
      g.arc(80, 78, 41, Math.PI * 1.02, Math.PI * 1.98, false);
      g.fillPath();
      g.fillCircle(124, 64, 20);
      g.fillStyle(C.pink, 1);
      g.fillCircle(112, 60, 4);
    } else {
      g.fillStyle(0xe4572e, 1);
      g.beginPath();
      g.arc(80, 72, 43, Math.PI, Math.PI * 2, false);
      g.fillPath();
      g.fillRoundedRect(34, 66, 92, 12, 6);
      g.fillStyle(C.cream, 1);
      g.fillCircle(80, 34, 8);
    }

    // Face.
    g.fillStyle(C.ink, 1);
    g.fillCircle(66, 82, 4.4);
    g.fillCircle(94, 82, 4.4);
    g.fillStyle(C.white, 1);
    g.fillCircle(64.5, 80.5, 1.5);
    g.fillCircle(92.5, 80.5, 1.5);
    g.fillStyle(C.ink, 1);
    g.fillStyle(C.ink, 1);
    smile(g, 80, 92, 16);
    g.fillStyle(C.pink, 0.4);
    g.fillCircle(50, 94, 6);
    g.fillCircle(110, 94, 6);

    if (style === 3 || style === 7) {
      g.lineStyle(2.5, C.ink, 0.8);
      g.strokeCircle(66, 82, 9);
      g.strokeCircle(94, 82, 9);
      g.beginPath();
      g.moveTo(75, 82);
      g.lineTo(85, 82);
      g.strokePath();
    }
  });
}

function drawClinicBackground(scene: Phaser.Scene): void {
  make(scene, 'bg-clinic', 720, 1280, (g) => {
    const bands = 14;
    for (let i = 0; i < bands; i += 1) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(C.wallTop),
        Phaser.Display.Color.ValueToColor(C.wallBottom),
        bands - 1,
        i,
      );
      g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      g.fillRect(0, (i * 700) / bands, 720, 700 / bands + 1);
    }

    // Soft wall stripes.
    g.fillStyle(C.white, 0.18);
    for (let x = 20; x < 720; x += 84) {
      g.fillRoundedRect(x, 0, 34, 690, 17);
    }

    // Window.
    g.fillStyle(C.white, 1);
    g.fillRoundedRect(420, 154, 232, 190, 22);
    g.fillStyle(0xbfe9ff, 1);
    g.fillRoundedRect(433, 167, 206, 164, 14);
    g.fillStyle(0xfff2b8, 1);
    g.fillCircle(590, 206, 22);
    g.fillStyle(C.white, 0.9);
    g.fillCircle(486, 214, 18);
    g.fillCircle(510, 210, 24);
    g.fillCircle(536, 216, 16);
    g.lineStyle(6, C.white, 1);
    g.beginPath();
    g.moveTo(536, 167);
    g.lineTo(536, 331);
    g.moveTo(433, 246);
    g.lineTo(639, 246);
    g.strokePath();
    g.fillStyle(C.white, 0.75);
    g.fillRoundedRect(414, 338, 244, 12, 6);

    // Poster with paw.
    g.fillStyle(C.white, 0.92);
    g.fillRoundedRect(118, 196, 186, 152, 18);
    g.fillStyle(C.mint, 0.8);
    g.fillRoundedRect(130, 208, 162, 128, 12);
    drawPaw(g, 211, 264, 2.2, C.white, 0.9);
    g.fillStyle(C.white, 0.65);
    g.fillRoundedRect(146, 300, 130, 10, 5);
    g.fillRoundedRect(160, 316, 102, 8, 4);

    // Little wall shelf with jars on the right.
    g.fillStyle(C.wood, 1);
    g.fillRoundedRect(580, 398, 112, 12, 6);
    g.fillStyle(C.pinkLight, 1);
    g.fillRoundedRect(596, 356, 30, 42, 8);
    g.fillStyle(0xbde8d8, 1);
    g.fillRoundedRect(636, 366, 28, 32, 8);
    g.fillStyle(C.white, 0.7);
    g.fillRoundedRect(602, 360, 18, 8, 4);

    // Baseboard.
    g.fillStyle(0xe8cfb2, 1);
    g.fillRect(0, 690, 720, 22);
    g.fillStyle(0xd9b995, 1);
    g.fillRect(0, 706, 720, 8);

    // Floor.
    g.fillStyle(C.floorA, 1);
    g.fillRect(0, 714, 720, 566);
    for (let y = 714; y < 1280; y += 64) {
      g.fillStyle(y % 128 === 714 % 128 ? C.floorB : C.floorA, 1);
      g.fillRect(0, y, 720, 64);
      g.lineStyle(2, 0xe2c49b, 0.55);
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(720, y);
      g.strokePath();
    }
    g.lineStyle(2, 0xdcbb8d, 0.5);
    for (let row = 0; row < 9; row += 1) {
      const y = 714 + row * 64;
      const offset = row % 2 === 0 ? 0 : 90;
      for (let x = offset; x < 720; x += 180) {
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x, y + 64);
        g.strokePath();
      }
    }

    // Rug under the treatment area.
    g.fillStyle(C.pinkLight, 0.55);
    g.fillRoundedRect(44, 780, 632, 288, 60);
    g.lineStyle(8, C.white, 0.4);
    g.strokeRoundedRect(58, 794, 604, 260, 50);
    g.fillStyle(C.white, 0.22);
    g.fillRoundedRect(90, 820, 540, 206, 46);

    // Wall trim shadows.
    g.fillStyle(0x9c7a5a, 0.12);
    g.fillRect(0, 690, 720, 3);
  });

  make(scene, 'door', 180, 280, (g) => {
    g.fillStyle(C.woodDark, 0.25);
    g.fillRoundedRect(8, 12, 168, 268, 18);
    g.fillStyle(C.mint, 1);
    g.fillRoundedRect(4, 4, 168, 268, 18);
    g.fillStyle(C.mintDark, 1);
    g.fillRoundedRect(18, 20, 140, 238, 12);
    g.fillStyle(0xcdeee4, 1);
    g.fillRoundedRect(32, 36, 112, 96, 10);
    g.fillStyle(0xbfe9ff, 1);
    g.fillRoundedRect(40, 44, 96, 80, 8);
    g.fillStyle(C.white, 0.8);
    g.fillCircle(64, 66, 11);
    g.fillCircle(80, 62, 15);
    g.fillStyle(C.yellow, 1);
    g.fillCircle(158, 156, 8);
    g.fillStyle(C.white, 0.9);
    g.fillRoundedRect(48, 168, 84, 48, 10);
    drawPaw(g, 90, 188, 1.35, C.mintDark);
    g.fillStyle(C.white, 0.9);
    g.fillRoundedRect(44, 266, 88, 10, 5);
  });

  make(scene, 'chair', 130, 156, (g) => {
    g.fillStyle(0xc7a27b, 0.4);
    g.fillEllipse(65, 144, 96, 16);
    g.fillStyle(C.woodDark, 1);
    g.fillRoundedRect(30, 92, 10, 48, 5);
    g.fillRoundedRect(90, 92, 10, 48, 5);
    g.fillStyle(C.mint, 1);
    g.fillRoundedRect(16, 78, 98, 30, 14);
    g.fillStyle(C.mintDark, 1);
    g.fillRoundedRect(20, 16, 90, 74, 22);
    g.fillStyle(C.mint, 1);
    g.fillRoundedRect(28, 24, 74, 52, 16);
    g.fillStyle(C.white, 0.35);
    g.fillRoundedRect(34, 30, 60, 10, 5);
  });

  make(scene, 'plant', 120, 160, (g) => {
    g.fillStyle(0x9c7a5a, 0.2);
    g.fillEllipse(60, 152, 84, 16);
    g.fillStyle(0xd98e6a, 1);
    g.fillRoundedRect(34, 104, 52, 46, 10);
    g.fillStyle(0xc47755, 1);
    g.fillRoundedRect(28, 100, 64, 16, 8);
    g.fillStyle(0x79c98b, 1);
    g.fillEllipse(42, 72, 38, 24);
    g.fillEllipse(78, 64, 40, 26);
    g.fillEllipse(60, 44, 34, 28);
    g.fillEllipse(30, 90, 26, 18);
    g.fillEllipse(90, 90, 26, 18);
    g.fillStyle(0x9add9f, 0.8);
    g.fillEllipse(54, 48, 12, 8);
  });

  for (let i = 0; i < 8; i += 1) drawCustomer(scene, i);

  for (const kind of PET_KINDS) {
    for (const mood of PET_MOODS) drawPet(scene, kind, mood);
  }
}

function drawBeds(scene: Phaser.Scene): void {
  const blankets = [C.mint, C.pink, C.blue, C.lilac, C.yellow];
  for (let i = 0; i < 5; i += 1) {
    make(scene, bedTextureKey(i), 200, 150, (g) => {
      g.fillStyle(0x8b6a4a, 0.18);
      g.fillEllipse(100, 140, 170, 18);
      g.fillStyle(C.woodDark, 1);
      g.fillRoundedRect(26, 104, 12, 26, 5);
      g.fillRoundedRect(162, 104, 12, 26, 5);
      g.fillStyle(C.wood, 1);
      g.fillRoundedRect(16, 84, 168, 28, 10);
      g.fillStyle(C.white, 1);
      g.fillRoundedRect(22, 58, 156, 38, 15);
      g.fillStyle(C.cream, 1);
      g.fillRoundedRect(30, 42, 56, 30, 12);
      g.fillStyle(blankets[i], 1);
      g.fillRoundedRect(90, 58, 88, 40, 14);
      g.fillStyle(C.white, 0.45);
      g.fillRoundedRect(90, 58, 88, 9, 5);
      g.fillStyle(C.white, 0.9);
      g.fillCircle(158, 84, 11);
      g.lineStyle(3, blankets[i], 1);
      g.beginPath();
      g.moveTo(158, 77);
      g.lineTo(158, 91);
      g.moveTo(151, 84);
      g.lineTo(165, 84);
      g.strokePath();
      g.fillStyle(C.woodDark, 1);
      g.fillRoundedRect(126, 118, 58, 14, 6);
    });
  }
}

function drawTools(scene: Phaser.Scene): void {
  make(scene, 'tool-thermometer', 96, 96, (g) => {
    g.fillStyle(C.white, 1);
    g.fillRoundedRect(43, 10, 12, 54, 6);
    g.fillStyle(C.red, 1);
    g.fillCircle(49, 70, 14);
    g.fillStyle(C.white, 0.8);
    g.fillCircle(45, 66, 5);
    for (let y = 20; y < 58; y += 8) {
      g.fillStyle(C.ink, 0.5);
      g.fillRect(46, y, 6, 2);
    }
    g.lineStyle(3, C.ink, 0.35);
    g.strokeRoundedRect(43, 10, 12, 74, 6);
  });
  make(scene, 'tool-medicine', 96, 96, (g) => {
    g.fillStyle(C.white, 1);
    g.fillRoundedRect(28, 28, 40, 54, 10);
    g.fillStyle(C.coral, 1);
    g.fillRoundedRect(30, 42, 36, 38, 8);
    g.fillStyle(C.wood, 1);
    g.fillRoundedRect(34, 16, 28, 18, 5);
    g.fillStyle(C.white, 1);
    g.fillRect(45, 48, 6, 22);
    g.fillRect(37, 56, 22, 6);
    g.fillStyle(C.white, 0.5);
    g.fillRoundedRect(34, 32, 12, 6, 3);
  });
  make(scene, 'tool-bandage', 96, 96, (g) => {
    g.fillStyle(0xf3d2a6, 1);
    g.fillRoundedRect(10, 32, 76, 32, 14);
    g.fillStyle(0xe8b97f, 1);
    g.fillRoundedRect(34, 34, 28, 28, 8);
    g.fillStyle(C.white, 0.6);
    for (let x = 18; x < 76; x += 10) {
      g.fillCircle(x, 46, 2);
      g.fillCircle(x, 54, 2);
    }
    g.lineStyle(3, C.ink, 0.25);
    g.strokeRoundedRect(10, 32, 76, 32, 14);
  });
  make(scene, 'tool-sponge', 96, 96, (g) => {
    g.fillStyle(0xffd166, 1);
    g.fillRoundedRect(18, 42, 60, 34, 12);
    g.fillStyle(0xf0b93b, 1);
    g.fillRoundedRect(18, 58, 60, 18, 10);
    for (let i = 0; i < 5; i += 1) {
      g.fillStyle(C.white, 0.8);
      g.fillCircle(28 + i * 10, 34 - (i % 2) * 6, 5 + (i % 3));
    }
  });
  make(scene, 'tool-rinse', 96, 96, (g) => {
    drawDrop(g, 48, 50, 4.2, 0x7cc7f2);
    g.fillStyle(C.white, 0.65);
    g.fillEllipse(40, 44, 8, 12);
    g.lineStyle(3, 0x5aa8d6, 0.4);
    g.strokeCircle(48, 52, 30);
  });
  make(scene, 'tool-food', 96, 96, (g) => {
    g.fillStyle(0x8b6a4a, 0.2);
    g.fillEllipse(48, 78, 66, 14);
    g.fillStyle(0x7a5a44, 1);
    g.fillRoundedRect(16, 48, 64, 30, 12);
    g.fillStyle(0x9c7454, 1);
    g.fillRoundedRect(12, 42, 72, 16, 8);
    g.fillStyle(0xb98d68, 1);
    g.fillEllipse(48, 48, 56, 14);
    for (let i = 0; i < 7; i += 1) {
      g.fillStyle([C.yellow, 0xd98e6a, 0x9c7454][i % 3], 1);
      g.fillCircle(28 + i * 6, 46 - (i % 3) * 3, 4);
    }
  });
  make(scene, 'tool-brush', 96, 96, (g) => {
    g.fillStyle(C.pink, 1);
    g.fillRoundedRect(14, 42, 50, 16, 8);
    g.fillStyle(0xd9778e, 1);
    g.fillRoundedRect(18, 46, 42, 8, 4);
    g.fillStyle(0xb8b0c2, 1);
    g.fillRoundedRect(58, 38, 16, 24, 5);
    g.fillStyle(0xe8e2ef, 1);
    for (let i = 0; i < 4; i += 1) {
      g.fillRoundedRect(72, 40 + i * 5, 12, 3, 1.5);
    }
  });
  make(scene, 'tool-heart', 96, 96, (g) => {
    drawHeart(g, 48, 42, 44, C.red);
    g.fillStyle(C.white, 0.55);
    g.fillEllipse(36, 30, 12, 8);
  });
  make(scene, 'tool-pillow', 96, 96, (g) => {
    g.fillStyle(0xe6e0f2, 1);
    g.fillRoundedRect(12, 30, 72, 40, 18);
    g.fillStyle(C.white, 1);
    g.fillRoundedRect(18, 36, 60, 28, 14);
    g.fillStyle(0xd7cfeb, 1);
    g.fillCircle(20, 50, 3);
    g.fillCircle(76, 50, 3);
    g.fillStyle(C.lilac, 0.7);
    g.fillCircle(48, 48, 5);
  });
}

function drawNeedIcons(scene: Phaser.Scene): void {
  make(scene, 'need-fever', 64, 64, (g) => {
    g.fillStyle(C.white, 0.9);
    g.fillRoundedRect(8, 8, 48, 48, 14);
    g.fillStyle(0xffb3a7, 1);
    g.fillCircle(32, 32, 17);
    g.fillStyle(C.ink, 1);
    g.fillCircle(26, 30, 2.5);
    g.fillCircle(38, 30, 2.5);
    smile(g, 32, 38, 10);
    g.fillStyle(C.red, 1);
    g.fillRoundedRect(44, 14, 7, 24, 3.5);
    g.fillCircle(47.5, 42, 6);
    g.fillStyle(C.white, 0.7);
    g.fillRect(46, 20, 2, 12);
  });
  make(scene, 'need-wound', 64, 64, (g) => {
    g.fillStyle(C.white, 0.9);
    g.fillRoundedRect(8, 8, 48, 48, 14);
    g.fillStyle(0xf3d2a6, 1);
    g.fillRoundedRect(12, 24, 40, 16, 7);
    g.fillStyle(0xe8b97f, 1);
    g.fillRoundedRect(24, 26, 16, 12, 5);
    g.fillStyle(C.red, 1);
    g.fillCircle(32, 32, 3);
  });
  make(scene, 'need-dirty', 64, 64, (g) => {
    g.fillStyle(C.white, 0.9);
    g.fillRoundedRect(8, 8, 48, 48, 14);
    g.fillStyle(0xbfe9ff, 1);
    g.fillCircle(24, 34, 10);
    g.fillCircle(40, 30, 8);
    g.fillCircle(34, 42, 6);
    g.fillStyle(C.white, 0.8);
    g.fillCircle(21, 31, 3);
    g.fillCircle(38, 27, 2);
    g.fillStyle(0x7cc7f2, 1);
    g.fillRoundedRect(30, 12, 10, 8, 3);
  });
  make(scene, 'need-hungry', 64, 64, (g) => {
    g.fillStyle(C.white, 0.9);
    g.fillRoundedRect(8, 8, 48, 48, 14);
    g.fillStyle(0x9c7454, 1);
    g.fillRoundedRect(14, 30, 36, 14, 7);
    g.fillStyle(C.yellow, 1);
    g.fillEllipse(32, 30, 30, 9);
    g.fillStyle(0xd98e6a, 1);
    g.fillCircle(24, 28, 4);
    g.fillCircle(32, 26, 4);
    g.fillCircle(40, 28, 4);
  });
  make(scene, 'need-itchy', 64, 64, (g) => {
    g.fillStyle(C.white, 0.9);
    g.fillRoundedRect(8, 8, 48, 48, 14);
    g.lineStyle(3, C.ink, 0.8);
    g.beginPath();
    g.moveTo(18, 24);
    g.lineTo(28, 30);
    g.lineTo(20, 36);
    g.lineTo(30, 42);
    g.strokePath();
    g.fillStyle(C.pink, 1);
    g.fillRoundedRect(34, 22, 18, 8, 4);
    g.fillStyle(0xb8b0c2, 1);
    g.fillRoundedRect(46, 22, 8, 24, 3);
  });
  make(scene, 'need-sad', 64, 64, (g) => {
    g.fillStyle(C.white, 0.9);
    g.fillRoundedRect(8, 8, 48, 48, 14);
    g.fillStyle(0xffd166, 1);
    g.fillCircle(32, 32, 17);
    g.fillStyle(C.ink, 1);
    g.fillCircle(26, 28, 2.5);
    g.fillCircle(38, 28, 2.5);
    g.lineStyle(2.5, C.ink, 1);
    g.beginPath();
    g.arc(32, 44, 8, Math.PI * 1.15, Math.PI * 1.85, false);
    g.strokePath();
    drawDrop(g, 46, 20, 0.8, 0x7cc7f2);
  });
  make(scene, 'need-sleepy', 64, 64, (g) => {
    g.fillStyle(C.white, 0.9);
    g.fillRoundedRect(8, 8, 48, 48, 14);
    g.fillStyle(C.lilac, 1);
    g.beginPath();
    g.arc(30, 30, 14, Math.PI * 0.35, Math.PI * 1.55, false);
    g.fillPath();
    g.lineStyle(3, C.ink, 0.7);
    g.beginPath();
    g.moveTo(38, 40);
    g.lineTo(46, 40);
    g.lineTo(38, 48);
    g.lineTo(46, 48);
    g.strokePath();
    g.fillStyle(C.ink, 0.6);
    g.fillRect(22, 20, 8, 2);
    g.fillRect(24, 16, 6, 2);
  });
}

function drawUi(scene: Phaser.Scene): void {
  make(scene, 'ui-coin', 64, 64, (g) => {
    g.fillStyle(0xd9a62d, 1);
    g.fillCircle(32, 32, 27);
    g.fillStyle(C.yellow, 1);
    g.fillCircle(32, 30, 25);
    g.fillStyle(0xffe6a3, 1);
    g.fillCircle(25, 23, 10);
    drawStar(g, 32, 31, 14, 6, 0xd9a62d);
  });
  make(scene, 'ui-heart', 64, 64, (g) => {
    drawHeart(g, 32, 30, 40, C.red);
    g.fillStyle(C.white, 0.5);
    g.fillEllipse(22, 20, 11, 8);
  });
  make(scene, 'ui-heart-empty', 64, 64, (g) => {
    drawHeart(g, 32, 30, 40, 0xffffff, 0.22);
    g.lineStyle(3, C.ink, 0.25);
    g.strokePoints(heartPoints(32, 30, 40), true);
  });
  make(scene, 'ui-star', 64, 64, (g) => {
    drawStar(g, 32, 33, 27, 12, C.yellow);
    g.fillStyle(C.white, 0.65);
    g.fillEllipse(24, 22, 10, 6);
  });
  make(scene, 'ui-star-empty', 64, 64, (g) => {
    drawStar(g, 32, 33, 27, 12, 0xffffff, 0.25);
    g.lineStyle(3, C.ink, 0.22);
    g.strokePoints(starPoints(32, 33, 27, 12), true);
  });
  make(scene, 'ui-check', 64, 64, (g) => {
    g.fillStyle(C.green, 1);
    g.fillCircle(32, 32, 25);
    g.lineStyle(7, C.white, 1);
    g.beginPath();
    g.moveTo(18, 33);
    g.lineTo(28, 43);
    g.lineTo(47, 21);
    g.strokePath();
  });
  make(scene, 'bubble', 180, 160, (g) => {
    g.fillStyle(0x8b6a4a, 0.12);
    g.fillRoundedRect(10, 8, 160, 112, 26);
    g.fillStyle(C.white, 0.98);
    g.fillRoundedRect(6, 2, 160, 112, 26);
    g.lineStyle(3, C.blue, 0.35);
    g.strokeRoundedRect(6, 2, 160, 112, 26);
    g.fillStyle(C.white, 0.98);
    g.fillTriangle(64, 110, 92, 110, 72, 138);
    g.lineStyle(3, C.blue, 0.35);
    g.beginPath();
    g.moveTo(64, 112);
    g.lineTo(72, 138);
    g.lineTo(92, 112);
    g.strokePath();
    g.fillStyle(C.white, 1);
    g.fillTriangle(66, 110, 90, 110, 72, 134);
  });
  make(scene, 'shadow', 128, 48, (g) => {
    g.fillStyle(0x3a2b3e, 0.12);
    g.fillEllipse(64, 24, 120, 40);
    g.fillStyle(0x3a2b3e, 0.12);
    g.fillEllipse(64, 26, 92, 26);
  });
  make(scene, 'highlight', 180, 120, (g) => {
    g.fillStyle(C.yellow, 0.28);
    g.fillEllipse(90, 60, 168, 108);
    g.lineStyle(6, C.yellow, 0.55);
    g.strokeEllipse(90, 60, 152, 96);
  });
  make(scene, 'arrow', 96, 96, (g) => {
    g.fillStyle(C.white, 0.95);
    g.fillRoundedRect(18, 40, 44, 20, 10);
    g.fillTriangle(56, 26, 86, 50, 56, 74);
    g.lineStyle(4, C.coral, 0.9);
    g.strokeRoundedRect(18, 40, 44, 20, 10);
    g.strokeTriangle(56, 26, 86, 50, 56, 74);
  });
  make(scene, 'spark', 32, 32, (g) => {
    drawStar(g, 16, 16, 15, 4, C.white);
  });
  make(scene, 'confetti-bit', 18, 26, (g) => {
    g.fillStyle(C.white, 1);
    g.fillRoundedRect(2, 2, 14, 22, 5);
    g.fillStyle(0xffffff, 0.5);
    g.fillRoundedRect(4, 4, 5, 8, 2);
  });
  make(scene, 'heart-bit', 20, 20, (g) => {
    drawHeart(g, 10, 9, 13, C.pink);
  });
  make(scene, 'ui-plus', 48, 48, (g) => {
    g.fillStyle(C.white, 1);
    g.fillRoundedRect(20, 8, 8, 32, 4);
    g.fillRoundedRect(8, 20, 32, 8, 4);
  });
  make(scene, 'ui-cross', 48, 48, (g) => {
    g.fillStyle(C.white, 0.95);
    g.fillRoundedRect(10, 18, 28, 12, 6);
    g.fillRoundedRect(18, 10, 12, 28, 6);
  });
  make(scene, 'paw', 64, 64, (g) => {
    drawPaw(g, 32, 34, 1.8, C.white);
  });
  make(scene, 'rug', 96, 96, (g) => {
    g.fillStyle(0x8b6a4a, 0.14);
    g.fillRoundedRect(12, 26, 72, 52, 16);
    g.fillStyle(C.yellow, 1);
    g.fillRoundedRect(10, 20, 76, 54, 16);
    g.fillStyle(C.pinkLight, 0.9);
    g.fillRoundedRect(17, 27, 62, 40, 12);
    g.fillStyle(C.white, 0.55);
    g.fillRoundedRect(24, 34, 48, 26, 9);
    g.fillStyle(C.coral, 0.45);
    g.fillRoundedRect(28, 67, 40, 4, 2);
    g.fillStyle(C.white, 0.45);
    g.fillRoundedRect(32, 23, 32, 4, 2);
  });
  make(scene, 'logo-paw', 128, 128, (g) => {
    g.fillStyle(C.white, 0.18);
    g.fillCircle(64, 64, 60);
    drawPaw(g, 64, 66, 3.6, C.white, 0.95);
  });
}

/**
 * Generates every texture the game can fall back to. Existing textures are
 * kept, so real art loaded by PreloadScene always wins.
 */
export function generatePlaceholderTextures(scene: Phaser.Scene): void {
  drawClinicBackground(scene);
  drawBeds(scene);
  drawTools(scene);
  drawNeedIcons(scene);
  drawUi(scene);
}

