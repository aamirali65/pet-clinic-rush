export class SpawnSystem {
  private elapsed = 0;
  private running = false;
  interval: number;

  constructor(interval: number) {
    this.interval = interval;
  }

  start(): void {
    this.running = true;
    this.elapsed = 0;
  }

  stop(): void {
    this.running = false;
  }

  reset(interval = this.interval): void {
    this.interval = interval;
    this.elapsed = 0;
  }

  get isRunning(): boolean {
    return this.running;
  }

  update(deltaMs: number, canSpawn: boolean): boolean {
    if (!this.running) return false;
    this.elapsed += deltaMs;
    if (this.elapsed < this.interval || !canSpawn) {
      this.elapsed = Math.min(this.elapsed, this.interval);
      return false;
    }
    this.elapsed = 0;
    return true;
  }
}
