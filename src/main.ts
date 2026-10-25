import Phaser from 'phaser';
import { gameConfig } from '@/config/gameConfig';
import { SCENES } from '@/config/sceneKeys';

type SceneCtor = new () => Phaser.Scene;

/**
 * Scenes are discovered through Vite's glob import so that each agent can add
 * scene files without touching a shared registry. Registration order follows
 * SCENES so the HUD always renders above the clinic.
 */
const modules = import.meta.glob('./scenes/*Scene.ts', { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

function collectScenes(): SceneCtor[] {
  const byName = new Map<string, SceneCtor>();
  for (const mod of Object.values(modules)) {
    for (const value of Object.values(mod)) {
      if (typeof value !== 'function') continue;
      if (!(value.prototype instanceof Phaser.Scene)) continue;
      const ctor = value as SceneCtor;
      byName.set(ctor.name, ctor);
    }
  }

  const ordered: SceneCtor[] = [];
  for (const key of Object.values(SCENES)) {
    const ctor = byName.get(key);
    if (!ctor) continue;
    ordered.push(ctor);
    byName.delete(key);
  }
  for (const ctor of byName.values()) ordered.push(ctor);
  return ordered;
}

function hideBootSplash(): void {
  const splash = document.getElementById('boot-splash');
  if (!splash) return;
  splash.classList.add('hidden');
  window.setTimeout(() => splash.remove(), 420);
}

window.addEventListener('game-ready', hideBootSplash, { once: true });

gameConfig.scene = collectScenes();
const game = new Phaser.Game(gameConfig);

// Dev-only handle so agents and QA can inspect the running scenes from the console.
if (import.meta.env.DEV) {
  (window as unknown as { __pcrGame?: Phaser.Game }).__pcrGame = game;
}

