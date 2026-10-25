import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export class HapticsService {
  private static singleton: HapticsService | null = null;
  private enabled = true;
  private lastPulse = 0;

  static get(): HapticsService {
    if (!HapticsService.singleton) HapticsService.singleton = new HapticsService();
    return HapticsService.singleton;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  light(): void {
    this.impact(ImpactStyle.Light, 30);
  }

  medium(): void {
    this.impact(ImpactStyle.Medium, 40);
  }

  heavy(): void {
    this.impact(ImpactStyle.Heavy, 60);
  }

  success(): void {
    this.notify(NotificationType.Success);
  }

  warning(): void {
    this.notify(NotificationType.Warning);
  }

  error(): void {
    this.notify(NotificationType.Error);
  }

  private impact(style: ImpactStyle, cooldown: number): void {
    if (!this.canPulse(cooldown)) return;
    void Haptics.impact({ style }).catch(() => {
      this.browserVibrate(12);
    });
  }

  private notify(type: NotificationType): void {
    if (!this.canPulse(80)) return;
    void Haptics.notification({ type }).catch(() => {
      this.browserVibrate(type === NotificationType.Error ? 40 : 20);
    });
  }

  private canPulse(cooldown: number): boolean {
    if (!this.enabled) return false;
    const now = Date.now();
    if (now - this.lastPulse < cooldown) return false;
    this.lastPulse = now;
    return true;
  }

  private browserVibrate(ms: number): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        /* vibration is best effort */
      }
    }
  }
}

export const haptics = HapticsService.get();
