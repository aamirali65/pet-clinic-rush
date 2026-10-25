# Assets

Every external file is listed with its source, author and license. The game
also generates a full set of textures at boot, so it is playable even if an
external file is missing.

## Bundled files

### Fonts

| File | Source | Author | License |
| --- | --- | --- | --- |
| `public/assets/fonts/Baloo2.ttf` | https://github.com/google/fonts/tree/main/ofl/baloo2 | Ek Type / Google Fonts | SIL Open Font License 1.1 (`public/assets/fonts/OFL.txt`) |

Load it with the FontFace API in `PreloadScene` before the first menu. The CSS
fallback stack is `"Baloo 2", "Fredoka", "Nunito", Arial, sans-serif`.

### UI icons

All from **Kenney Game Icons** (CC0, https://kenney.nl/assets/game-icons).
Files live in `public/assets/images/ui/` and are white 50x50 PNGs that are
tinted at runtime.

`star`, `checkmark`, `cross`, `gear`, `home`, `pause`, `plus`, `minus`,
`question`, `locked`, `unlocked`, `trophy`, `medal1`, `musicOn`, `musicOff`,
`audioOn`, `audioOff`, `video`, `exitLeft`, `next`, `previous`, `warning`,
`exclamation`, `information`, `door`, `cart`, `basket`, `arrowLeft`,
`arrowRight`, `arrowUp`, `arrowDown`.

Some UI icons (heart, coin, clock, clinic tools) are generated because the icon
pack has no medical set. See the placeholder list below.

### Sound effects

All from **Kenney Interface Sounds** (CC0,
https://kenney.nl/assets/interface-sounds). Renamed by gameplay meaning in
`public/assets/audio/sfx/`:

| Game key | Original file |
| --- | --- |
| `tap` | click_001.ogg |
| `pick` | select_001.ogg |
| `place` | drop_001.ogg |
| `wrong` | error_004.ogg |
| `cure` | confirmation_002.ogg |
| `coin` | pluck_001.ogg |
| `level-complete` | jingles_PIZZI02.ogg |
| `game-over` | jingles_NES05.ogg |
| `heart-lost` | error_005.ogg |
| `scratch` | scratch_002.ogg |
| `tick` | tick_001.ogg |
| `open` | open_001.ogg |
| `close` | close_001.ogg |
| `pop` | drop_002.ogg |
| `sparkle` | glass_001.ogg |
| `swipe` | scratch_004.ogg |
| `hold` | tick_002.ogg |
| `star` | confirmation_003.ogg |
| `level-start` | confirmation_001.ogg |
| `bad` | error_001.ogg |

Music is generated live with the Web Audio API (a soft, looping ukulele-style
arpeggio in `AudioManager`), so no music file is shipped. This keeps the APK
small and the loop seamless.

### Particle textures

From **Kenney Particle Pack** (CC0, https://kenney.nl/assets/particle-pack),
`public/assets/images/particles/`:

- `sparkle.png` (circle_05) - cure sparkles and button glints.
- `dot.png` (circle_02) - soft puffs and dust.
- `confetti.png` (light_01) - level-complete confetti (tinted per particle).

### Decorative pet portraits

From **Kenney Animal Pack Remastered** (CC0,
https://kenney.nl/assets/animal-pack-remastered), `public/assets/images/pets/`:

- `dog.png`, `rabbit.png`, `bird.png`, `hamster.png`.

These are round portrait badges, not full-body pets. The game's playable pets
are generated (see below) so all six species share one art style. The portraits
are used as unlock icons in the shop when available.

## Generated assets (placeholders that are also the final art)

`src/utils/placeholders.ts` draws every texture with Phaser Graphics at boot.
They are intentionally designed as the shipping art style (chunky, pastel,
cartoon) and are not temporary grey boxes.

| Group | Keys / description |
| --- | --- |
| Clinic | `bg-clinic`, `floor`, `wall`, `window`, `door`, `counter`, `rug`, `plant`, `poster-*` |
| Beds | `bed-0`..`bed-4`, `bed-shadow`, `pillow` |
| Pets | `pet-cat`, `pet-dog`, `pet-rabbit`, `pet-hamster`, `pet-bird`, `pet-turtle`; body, ear, face, tail and blush are composed at runtime. Mood variants are tinted and animated. |
| Customers | `customer-0`..`customer-7`; body, head, hair, shirt, face, hands. Variants by tint, hair and accessories. |
| Needs | `need-fever`, `need-wound`, `need-dirty`, `need-hungry`, `need-itchy`, `need-sad`, `need-sleepy` |
| Tools | `tool-thermometer`, `tool-medicine`, `tool-bandage`, `tool-sponge`, `tool-rinse`, `tool-food`, `tool-brush`, `tool-heart`, `tool-pillow` |
| UI | `btn-*`, `panel`, `panel-light`, `coin`, `heart`, `heart-empty`, `star`, `star-empty`, `lock`, `bubble`, `ring`, `check-badge` |
| FX | `spark`, `confetti-bit`, `heart-bit`, `shadow`, `highlight`, `arrow` |

## Replacing generated art with real files

1. Drop a PNG/atlas into `public/assets/images/` using the same key as the file
   name (for example `pet-cat.png`).
2. Add the load call in `PreloadScene` and register the key in
   `src/contracts/assetKeys.ts`.
3. Keep the generated fallback: `placeholders.ts` only creates a texture when
   `scene.textures.exists(key)` is false.
4. Update this file and `CREDITS.md` with source, author and license.

Suggested replacement sources (all free, check each page): Kenney animal packs,
OpenGameArt CC0 pet sprite sheets, itch.io CC0 clinic packs, Freesound CC0
audio. Do not add an asset without a license entry here.
