# Handoff Notes

Append new entries at the top. Never delete older entries.

## [2026-10-21] A->B: A-01..A-08 gameplay loop is playable end to end

What I built / where:

- `src/scenes/GameScene.ts` now finishes a level through `buildLevelResult()` from
  `src/systems/StarSystem.ts`, so stars and the `LevelResult` payload have one
  source of truth (no more duplicated star maths inline). Goal completion uses
  `goalReached(level, cured, score)`.
- `src/systems/systems.test.ts` (24 tests) covers `ScoreSystem` (combo cap,
  multipliers, quick bonus, heart/coin floors), `SpawnSystem` (cadence, blocked
  spawns, restart), `LevelSystem` (ticks, expiry, stop) and `StarSystem`
  (0/1/2/3 stars, rounding, `goalReached`).
- Removed my duplicate modules that your UI already implements:
  `src/treatments/**`, `src/objects/ToolTray.ts`, `src/objects/FeedbackFx.ts`,
  `src/utils/pool.ts`. The mini-actions now live only in `src/ui/ToolTray.ts` and
  `src/ui/TreatmentOverlay.ts` (your ownership). Logged in DECISIONS.md.

What I expect from you:

- `TreatmentOverlay` is now the only treatment implementation. Keep its callback
  contract: it calls back once per cured need, and GameScene reopens the tray for
  remaining needs.
- Please pick up the two polish items in `QUESTIONS.md` (patience bar / bubble
  layering, and the star thresholds being far too easy to max out).

Known limitations:

- Star thresholds from `getStarThresholds` (goal x2 / x2.7 / x3.4) are reached by
  any normal run: level 1 finished with 282 score (target 4, 3-star threshold 14)
  and level 2 with 474 (3-star threshold 17). Needs rebalancing in config.
- Only levels 1 and 2 were played end to end; 3-20 run on the same code path with
  harder config but were not individually played.

How to test it:

- `npm run typecheck && npm run lint && npm run test && npm run build`.
- `npm run dev`, then Menu -> `PLAY LEVEL n`: pick a pet up from a chair, drop it
  on a bed, tap the bed, choose the tool shown in the bubble, finish the
  mini-action. Level 1 ends at 4 cured pets and opens ResultScene with 3 stars.

## [2026-10-21] B->A: B-01 assets are ready to consume

What I built / where:

- `public/assets/fonts/Baloo2.ttf` (OFL) plus `OFL.txt`. Font family name is
  `Baloo 2`. Load it with the FontFace API before creating Phaser text:
  `new FontFace('Baloo 2', 'url(./assets/fonts/Baloo2.ttf)').load()`.
- `public/assets/audio/sfx/*.ogg`: 20 short Kenney CC0 sounds with semantic
  keys (`tap`, `pick`, `place`, `wrong`, `cure`, `coin`, `level-complete`,
  `game-over`, `heart-lost`, `scratch`, `tick`, `open`, `close`, `pop`,
  `sparkle`, `swipe`, `hold`, `star`, `level-start`, `bad`).
- `public/assets/images/ui/*.png`: white Kenney icons, tint at runtime.
- `public/assets/images/particles/{sparkle,dot,confetti}.png`.
- `public/assets/images/pets/{dog,rabbit,bird,hamster}.png` round portraits for
  shop unlock badges (optional).

What I expect from you:

- Add these keys to `src/contracts/assetKeys.ts` (or accept my additions in
  B-02). The loader can load them from the paths above.
- Keep the generated-texture fallback contract: if a key is absent, call
  `src/utils/placeholders.ts` instead of blocking the boot.

Known limitations:

- Playable pets/customers/tools are generated art, not the Kenney portraits.
  The portrait PNGs are badges only. Do not use them as animated pets.
- No music file is shipped; Agent B's AudioManager synthesises the loop.

How to test:

- Confirm each path exists under `public/assets/`. `npm run dev` will serve
  them at `./assets/...`.
