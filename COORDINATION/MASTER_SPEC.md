# Pet Clinic Rush - Master Specification

This is the shared source of truth for Agent A (gameplay engineer) and Agent B
(experience and content engineer). Both agents must keep this document accurate.

## Product

A cute, fast, kid-friendly pet hospital game for portrait Android phones.

Core loop:

1. Customers walk in through the clinic door carrying a pet.
2. Tap a waiting customer to pick up the pet.
3. Drag the pet (or tap the pet then a bed) onto a free bed.
4. Tap an occupied bed to open the treatment tool tray.
5. The pet's thought bubble shows its needs: fever, wound, dirty, hungry,
   itchy, sad, sleepy.
6. Treat each need with a short one-finger tap/drag/hold/swipe action.
7. All needs fixed -> pet is happy, the owner pays coins and score, confetti.
8. A customer whose patience runs out leaves angry; lose a heart and the combo.
9. Coins buy beds, tool speed, patience, coin bonus, waiting slots, pet unlocks.
10. Twenty levels with star ratings, a 7-day daily reward, tutorial and settings.

## Tech stack

- Phaser 3.90, TypeScript strict, Vite 8, ESLint, Prettier, Vitest.
- Capacitor 8: core, cli, android, haptics, preferences, app, status-bar,
  splash-screen.
- Portrait virtual resolution 720 x 1280, `Phaser.Scale.FIT`, autoCenter,
  WebGL with Canvas fallback, two active pointers, round pixels.
- Bundled OFL font: Baloo 2 (public/assets/fonts/Baloo2.ttf).
- Data-driven content in `src/config/`, no hardcoded content in scenes.
- 60 fps on a mid-range Android device, APK under 30 MB.

## Architecture and ownership

Agent A owns gameplay:

- `src/main.ts`, `src/config/gameConfig.ts`
- `src/scenes/BootScene.ts`, `PreloadScene.ts`, `GameScene.ts`
- `src/objects/**`, `src/systems/**`, `src/treatments/**`
- `src/utils/pool.ts` and tween/math helpers
- tests for systems

Agent B owns experience and content:

- `src/scenes/MenuScene.ts`, `LevelSelectScene.ts`, `HudScene.ts`, `ShopScene.ts`,
  `PauseScene.ts`, `ResultScene.ts`, `SettingsScene.ts`, `TutorialScene.ts`
- `src/ui/**`, `src/services/**`
- `src/config/pets.ts`, `needs.ts`, `levels.ts`, `upgrades.ts`, `customers.ts`,
  `constants.ts`
- `src/utils/placeholders.ts`
- `public/assets/**`, `ASSETS.md`, `CREDITS.md`
- `android/**`, Capacitor config, `RELEASE.md`
- tests for services and config

Shared, changed only through the contract change process:

- `src/contracts/types.ts`, `events.ts`, `assetKeys.ts`
- `package.json`, `tsconfig.json`, `.cursorrules`, `README.md`

Coordination files live in `COORDINATION/`. Both agents append; nobody deletes
the other's entries.

Scenes communicate through typed events in `src/contracts/events.ts` and
services. UI listens to gameplay events; gameplay never imports UI internals.

## Layout (720 x 1280)

- HUD: 0-140 (coins, score, hearts, level, combo, timer, pause).
- Clinic: door top-left, three waiting chairs, treatment beds in a row,
  tool tray at the bottom.
- Beds: empty, occupied, treating, done. 3 beds default, up to 5 with upgrades.
- Waiting slots: 3 default, up to 5 with upgrades.
- Safe areas handled with CSS env(safe-area-inset-*) and status bar plugin.

## Content

Pets: cat, dog, rabbit, hamster, bird, turtle. Each has colour variants, idle /
sick / happy mood and a need list.

Needs/treatments (about 3 seconds each):

1. Fever - drag thermometer onto pet, hold 1.5 s, tap medicine.
2. Wound - tap bandage onto the highlighted wound.
3. Dirty - scrub with sponge until the ring fills, then tap rinse.
4. Hungry - drag the food bowl to the pet's mouth; it munches.
5. Itchy - swipe the brush across the pet several times.
6. Sad - tap the heart repeatedly to fill the happiness meter.
7. Sleepy - tap the pillow, wait for a short timer.

Pets spawn from level config with type weights and need count.

## Progression

- 20 levels, each with goal (cured pets or target score) and time limit,
  spawn interval, patience multiplier, needs per pet, allowed pets, beds.
- Stars: 1 for winning, 2 and 3 for better score/time thresholds.
- Shop: extra bed (up to 5), faster tools, more patient customers, coin bonus,
  extra waiting slot, unlock pet types, decorations.
- Daily reward: 7-day local streak.
- Save: coins, level stars, best scores, unlocks, upgrades, settings, daily
  streak, tutorial seen. Versioned schema, migration, corruption recovery.

## Scoring

- Payout per cured pet depends on need count and speed.
- Combo x1..x5; angry customer resets it.
- Score is separate from coins. Three hearts; game over at zero.
- Stars and score pops, coin fly-to-HUD, confetti, haptics.

## Assets

Free only (CC0 / CC-BY). Every file documented in ASSETS.md and CREDITS.md.
If a real asset is unavailable, generated textures in
`src/utils/placeholders.ts` keep the game playable. The loader prefers real
files and falls back to generated placeholders.

Bundled:

- Baloo 2 font, SIL Open Font License 1.1 (Google Fonts).
- Kenney UI icons, CC0 (kenney.nl).
- Kenney Interface Sounds, CC0.
- Kenney Particle Pack, CC0.
- Kenney Animal Pack Remastered portraits, CC0 (optional decorative use).

## Phases

Phase 0: scaffold, tooling, docs, hello-world boot.
Phase 1: asset keys, placeholder generator, real assets, font, animations.
Phase 2: clinic layout, beds, HUD, safe areas.
Phase 3: customers, pets, queue, patience.
Phase 4: pick up, drag, drop, tap-to-place, multi-touch.
Phase 5: seven treatments, tool tray, feedback.
Phase 6: score, coins, combos, hearts, HUD, tests.
Phase 7: 20 levels, level select, result, shop, upgrades, daily reward.
Phase 8: menus, pause, settings, tutorial, audio, juice.
Phase 9: persistence, performance, robustness, tests.
Phase 10: Capacitor Android packaging.
Phase 11: optional ads behind a flag with test IDs, release docs and builds.

## Definition of done

- `npm run dev` boots to the menu; a full level is playable start to finish.
- 20 levels, shop, daily reward, settings, tutorial, saved progress work.
- typecheck, lint, tests and build pass; no crashes; smooth 60 fps.
- Assets documented; placeholders listed where real files are missing.
- Release APK/AAB builds through Capacitor; README and RELEASE.md complete.
