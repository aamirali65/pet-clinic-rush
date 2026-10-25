# Task Board

Single source of truth. Pick only tasks for your own role. Set `IN_PROGRESS`
before starting, `IN_REVIEW` when finished, `DONE` after review.

| ID | Title | Owner | Status | Depends on | Branch | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| C0-1 | Scaffold Vite/TS/Phaser project, tooling, hello boot | B (cover) | DONE | - | agent-a/c0-scaffold | Boots green; splash hidden on `game-ready` |
| C0-2 | Shared contracts: types, events, asset keys, service interfaces | A/B | DONE | C0-1 | agent-a/c0-contracts | In use by gameplay, HUD and services |
| C0-3 | Review and approve contracts | B | DONE | C0-2 | - | Approved in practice by the integrated build |
| B-01 | Asset research, font, Kenney UI/SFX/particles, ASSETS/CREDITS | B | DONE | - | agent-b/b01-assets | Font + 20 SFX + UI/particle PNGs |
| B-02 | Placeholder textures for every asset key | B | DONE | C0-2 | agent-b/b02-placeholders | Preload calls `generatePlaceholderTextures` |
| B-03 | Config data: pets, needs, customers, 20 levels, upgrades + tests | B | DONE | C0-2 | agent-b/b03-config | 9 config tests pass |
| B-04 | SaveService with Preferences/localStorage, migration, tests | B | DONE | C0-2 | agent-b/b04-save | 11 tests pass |
| B-05 | AudioManager, HapticsService, AdService no-op, tests | B | DONE | C0-2 | agent-b/b05-services | Procedural music + Kenney SFX |
| B-06 | HudScene (coins, score, hearts, combo, timer, pause) | B | DONE | A-02 | agent-b/b06-hud | Reviewed in browser: coins/score/hearts/goal/timer all live |
| B-07 | MenuScene, LevelSelectScene, fade transitions | B | DONE | B-03, B-04 | agent-b/b07-menus | `PLAY LEVEL n` resumes progress correctly |
| B-08 | PauseScene, ResultScene with progress write | B | DONE | B-04, B-06 | agent-b/b08-pause-result | Result scene renders a full LevelResult |
| B-09 | ShopScene and persisted upgrades | B | DONE | B-03, B-04 | agent-b/b09-shop | GameScene applies bed/slot/patience/speed/coin upgrades |
| B-10 | SettingsScene, TutorialScene, daily reward | B | DONE | B-04, B-05 | agent-b/b10-settings-tutorial | Tutorial gate persists in save |
| B-11 | UI polish, juice, low patience warning, confetti | B | IN_REVIEW | B-07..B-10 | agent-b/b11-polish | A review: thought bubbles overlap the door art and the patience bar floats above them |
| B-12 | Capacitor Android packaging and device QA | B | TODO | A-07, B-11 | agent-b/b12-android | |
| B-13 | Release docs, ads flag, final QA and builds | B | TODO | B-12 | agent-b/b13-release | |
| A-01 | GameScene/HudScene layout, beds, door, safe areas | A | DONE | C0-2 | agent-a/a01-clinic | 720x1280, 3-5 beds, chairs scale with slots |
| A-02 | Customers, pets, queue, patience | A | DONE | A-01 | agent-a/a02-customers | Walk-in tween, idle bob, bubble, patience, angry leave |
| A-03 | Pick up, drag, place, multi-touch | A | DONE | A-02 | agent-a/a03-drag | Drag + tap-a-bed fallback, snap back, occupied-bed shake |
| A-04 | Seven treatments and tool tray | A | DONE | A-03 | agent-a/a04-treatments | Mini-actions live in `ui/ToolTray` + `ui/TreatmentOverlay` (see DECISIONS 2026-10-21) |
| A-05 | Scoring, coins, combo, hearts, level results | A | DONE | A-04 | agent-a/a05-scoring | `ScoreSystem` + `StarSystem`, 24 system tests |
| A-06 | Arena/scene integration with 20 levels + shop effects | A | DONE | A-05, B-03, B-09 | agent-a/a06-levels | Levels 1 and 2 played to completion in the browser |
| A-07 | Persistence/perf/robustness pass in gameplay | A | DONE | A-06 | agent-a/a07-robustness | Scene shutdown cleanup, hidden-tab pause, held-pet edge cases |
| A-08 | Boot/Preload real-asset loader with placeholder fallback | A | DONE | B-02 | agent-a/a08-loader | `generatePlaceholderTextures` fallback on preload failure |

