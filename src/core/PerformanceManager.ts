export type QualityTier = "high" | "balanced" | "low";
export interface QualitySettings {
  pixelRatioCap: number;
  shadowMapSize: number;
  animatedDetailScale: number;
}

const QUALITY_TIERS: readonly QualityTier[] = ["high", "balanced", "low"];
const QUALITY_SETTINGS: Record<QualityTier, QualitySettings> = {
  high: { pixelRatioCap: 1.75, shadowMapSize: 2048, animatedDetailScale: 1 },
  balanced: { pixelRatioCap: 1.35, shadowMapSize: 1024, animatedDetailScale: 0.72 },
  low: { pixelRatioCap: 1, shadowMapSize: 512, animatedDetailScale: 0.45 },
};
const SLOW_FRAME_MS = 1000 / 45;
const FAST_FRAME_MS = 1000 / 58;
const FRAMES_TO_DOWNGRADE = 180;
const FRAMES_TO_UPGRADE = 300;

export class PerformanceManager {
  private tierIndex = 0;
  private slowFrames = 0;
  private fastFrames = 0;

  get tier(): QualityTier {
    return QUALITY_TIERS[this.tierIndex];
  }

  get pixelRatioCap(): number {
    return this.settings.pixelRatioCap;
  }

  get settings(): QualitySettings {
    return QUALITY_SETTINGS[this.tier];
  }

  sample(deltaMs: number): QualityTier | null {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return null;

    if (deltaMs > SLOW_FRAME_MS) {
      this.slowFrames += 1;
      this.fastFrames = 0;
    } else if (deltaMs < FAST_FRAME_MS) {
      this.fastFrames += 1;
      this.slowFrames = 0;
    } else {
      this.slowFrames = 0;
      this.fastFrames = 0;
    }

    if (this.slowFrames >= FRAMES_TO_DOWNGRADE && this.tierIndex < QUALITY_TIERS.length - 1) {
      this.tierIndex += 1;
      this.slowFrames = 0;
      return this.tier;
    }

    if (this.fastFrames >= FRAMES_TO_UPGRADE && this.tierIndex > 0) {
      this.tierIndex -= 1;
      this.fastFrames = 0;
      return this.tier;
    }

    return null;
  }
}
