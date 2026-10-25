import Phaser from 'phaser';

export type SfxKey =
  | 'tap'
  | 'pick'
  | 'place'
  | 'wrong'
  | 'cure'
  | 'coin'
  | 'level-complete'
  | 'game-over'
  | 'heart-lost'
  | 'scratch'
  | 'tick'
  | 'open'
  | 'close'
  | 'pop'
  | 'sparkle'
  | 'swipe'
  | 'hold'
  | 'star'
  | 'level-start'
  | 'bad';

interface SynthNote {
  freq: number;
  start: number;
  duration: number;
  type: OscillatorType;
  volume: number;
}

const MELODY = [261.63, 329.63, 392.0, 329.63, 261.63, 329.63, 392.0, 523.25];
const BASS = [130.81, 110.0, 87.31, 98.0];
const STEP_SECONDS = 60 / 84 / 2;

export class AudioManager {
  private static singleton: AudioManager | null = null;

  private scene: Phaser.Scene | null = null;
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private nextNoteTime = 0;
  private musicStep = 0;
  private musicEnabled = true;
  private sfxEnabled = true;
  private unlocked = false;
  private musicPlaying = false;
  private listenersAttached = false;
  private readonly activeSfx = new Set<Phaser.Sound.BaseSound>();

  static get(): AudioManager {
    if (!AudioManager.singleton) AudioManager.singleton = new AudioManager();
    return AudioManager.singleton;
  }

  bind(scene: Phaser.Scene): void {
    this.scene = scene;
    this.ensureContext();
    this.attachGlobalListeners();
    if (this.musicEnabled && this.unlocked) this.startMusic();
  }

  setSettings(music: boolean, sfx: boolean): void {
    this.musicEnabled = music;
    this.sfxEnabled = sfx;
    if (!music) this.stopMusic();
    else if (this.unlocked) this.startMusic();
    if (this.sfxGain && this.context) {
      this.sfxGain.gain.setTargetAtTime(sfx ? 0.8 : 0, this.context.currentTime, 0.03);
    }
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) this.stopMusic();
    else if (this.unlocked) this.startMusic();
  }

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    if (this.sfxGain && this.context) {
      this.sfxGain.gain.setTargetAtTime(enabled ? 0.8 : 0, this.context.currentTime, 0.03);
    }
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  isSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  unlock(): void {
    if (this.unlocked) {
      this.resumeContext();
      return;
    }
    this.unlocked = true;
    this.ensureContext();
    this.resumeContext();
    const sound = this.scene?.sound;
    try {
      sound?.unlock();
    } catch {
      /* the context resume below is the fallback */
    }
    if (this.musicEnabled) this.startMusic();
  }

  play(key: SfxKey, volume = 0.7): void {
    if (!this.sfxEnabled) return;
    const scene = this.scene;
    const prefixed = `sfx-${key}`;
    const cacheKey = scene?.cache.audio.exists(key)
      ? key
      : scene?.cache.audio.exists(prefixed)
        ? prefixed
        : null;
    if (scene && cacheKey) {
      try {
        const sound = scene.sound.add(cacheKey, { volume });
        this.activeSfx.add(sound);
        sound.once(Phaser.Sound.Events.COMPLETE, () => {
          this.activeSfx.delete(sound);
          sound.destroy();
        });
        sound.play();
        return;
      } catch {
        /* fall through to synthesis */
      }
    }
    this.synthSfx(key, volume);
  }

  startMusic(): void {
    if (!this.musicEnabled || this.musicPlaying) return;
    this.ensureContext();
    if (!this.context || !this.musicGain) return;
    this.musicPlaying = true;
    this.nextNoteTime = this.context.currentTime + 0.15;
    this.musicGain.gain.cancelScheduledValues(this.context.currentTime);
    this.musicGain.gain.setTargetAtTime(0.16, this.context.currentTime, 0.4);
    if (this.musicTimer != null) window.clearInterval(this.musicTimer);
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 300);
    this.scheduleMusic();
  }

  stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicTimer != null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.context && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(0, this.context.currentTime, 0.15);
    }
  }

  pauseForBackground(): void {
    this.stopMusic();
    void this.context?.suspend();
  }

  resumeAfterBackground(): void {
    this.resumeContext();
    if (this.musicEnabled && this.unlocked) this.startMusic();
  }

  stopAllSfx(): void {
    for (const sound of this.activeSfx) {
      try {
        sound.stop();
        sound.destroy();
      } catch {
        /* already destroyed */
      }
    }
    this.activeSfx.clear();
  }

  private attachGlobalListeners(): void {
    if (this.listenersAttached) return;
    this.listenersAttached = true;
    const onFirstGesture = (): void => this.unlock();
    window.addEventListener('pointerdown', onFirstGesture, { once: true });
    window.addEventListener('touchstart', onFirstGesture, { once: true, passive: true });
    window.addEventListener('keydown', onFirstGesture, { once: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.pauseForBackground();
      else this.resumeAfterBackground();
    });
    void import('@capacitor/app')
      .then(({ App }) => {
        void App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) this.resumeAfterBackground();
          else this.pauseForBackground();
        });
      })
      .catch(() => {
        /* web build without the native plugin */
      });
  }

  private ensureContext(): void {
    if (this.context) return;
    const webAudio = this.scene?.sound as Phaser.Sound.WebAudioSoundManager | undefined;
    const Ctor =
      typeof AudioContext !== 'undefined'
        ? AudioContext
        : typeof window !== 'undefined' &&
            'webkitAudioContext' in window &&
            typeof (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext !== 'undefined'
          ? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          : null;
    try {
      this.context =
        webAudio?.context ??
        (Ctor
          ? new Ctor()
          : null);
      if (!this.context) return;
      this.master = this.context.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.context.destination);
      this.sfxGain = this.context.createGain();
      this.sfxGain.gain.value = this.sfxEnabled ? 0.8 : 0;
      this.sfxGain.connect(this.master);
      this.musicGain = this.context.createGain();
      this.musicGain.gain.value = 0;
      this.musicGain.connect(this.master);
    } catch (error) {
      console.warn('Audio context unavailable', error);
      this.context = null;
    }
  }

  private resumeContext(): void {
    if (!this.context) this.ensureContext();
    if (this.context && this.context.state === 'suspended') {
      void this.context.resume();
    }
  }

  private scheduleMusic(): void {
    if (!this.context || !this.musicPlaying || !this.musicGain) return;
    if (this.context.state !== 'running') return;
    const horizon = this.context.currentTime + 0.75;
    while (this.nextNoteTime < horizon) {
      const step = this.musicStep % 32;
      const bar = Math.floor(step / 8) % 4;
      const note = MELODY[step % MELODY.length];
      const jitter = step % 4 === 2 ? 1.0 : 0.72;
      if (note != null) {
        this.scheduleTone({
          freq: note,
          start: this.nextNoteTime,
          duration: 0.32,
          type: 'triangle',
          volume: 0.09 * jitter,
        });
        this.scheduleTone({
          freq: note * 2,
          start: this.nextNoteTime + 0.02,
          duration: 0.18,
          type: 'sine',
          volume: 0.025,
        });
      }
      if (step % 4 === 0) {
        const bass = BASS[bar];
        if (bass != null) {
          this.scheduleTone({
            freq: bass,
            start: this.nextNoteTime,
            duration: 0.72,
            type: 'sine',
            volume: 0.14,
          });
        }
      }
      this.nextNoteTime += STEP_SECONDS;
      this.musicStep += 1;
    }
  }

  private scheduleTone(note: SynthNote): void {
    if (!this.context || !this.musicGain) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = note.type;
    osc.frequency.setValueAtTime(note.freq, note.start);
    gain.gain.setValueAtTime(0, note.start);
    gain.gain.linearRampToValueAtTime(note.volume, note.start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, note.start + note.duration);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(note.start);
    osc.stop(note.start + note.duration + 0.05);
  }

  private synthSfx(key: SfxKey, volume: number): void {
    this.ensureContext();
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    const base: Record<string, number> = {
      tap: 660,
      pick: 520,
      place: 330,
      wrong: 180,
      cure: 880,
      coin: 1040,
      'level-complete': 740,
      'game-over': 200,
      'heart-lost': 240,
      scratch: 420,
      tick: 900,
      open: 480,
      close: 360,
      pop: 600,
      sparkle: 1200,
      swipe: 500,
      hold: 700,
      star: 980,
      'level-start': 620,
      bad: 160,
    };
    const freq = base[key] ?? 440;
    const build = (start: number, f: number, dur: number, type: OscillatorType, vol: number): void => {
      if (!this.context || !this.sfxGain) return;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f, start);
      if (key === 'wrong' || key === 'bad' || key === 'game-over') {
        osc.frequency.exponentialRampToValueAtTime(Math.max(60, f * 0.6), start + dur);
      } else if (key === 'coin' || key === 'cure' || key === 'sparkle') {
        osc.frequency.exponentialRampToValueAtTime(f * 1.6, start + dur);
      }
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol * volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + dur + 0.03);
    };
    const bright = key === 'cure' || key === 'coin' || key === 'sparkle' || key === 'star';
    build(now, freq, bright ? 0.24 : 0.12, bright ? 'sine' : 'triangle', 0.18);
    if (bright) build(now + 0.09, freq * 1.25, 0.2, 'sine', 0.1);
    if (key === 'level-complete') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => build(now + i * 0.12, f, 0.34, 'triangle', 0.12));
    }
    if (key === 'game-over') {
      build(now + 0.18, freq * 0.8, 0.3, 'sine', 0.1);
      build(now + 0.38, freq * 0.6, 0.45, 'sine', 0.08);
    }
  }
}

export const audio = AudioManager.get();

