export class LevelSystem {
  readonly totalSeconds: number;
  remaining: number;
  private tickAccumulator = 0;
  private running = false;

  constructor(totalSeconds: number) {
    this.totalSeconds = totalSeconds;
    this.remaining = totalSeconds;
  }

  start(): void {
    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  update(deltaMs: number): { ticked: boolean; expired: boolean } {
    if (!this.running) return { ticked: false, expired: false };
    const before = Math.ceil(this.remaining);
    this.remaining = Math.max(0, this.remaining - deltaMs / 1000);
    this.tickAccumulator += deltaMs;
    const after = Math.ceil(this.remaining);
    const ticked = after !== before && this.tickAccumulator >= 200;
    if (ticked) this.tickAccumulator = 0;
    return { ticked, expired: this.remaining <= 0 };
  }

  get secondsLeft(): number {
    return Math.max(0, Math.ceil(this.remaining));
  }
}
