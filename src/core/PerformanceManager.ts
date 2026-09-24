export type QualityTier = "high" | "balanced" | "low";

const QUALITY_TIERS: readonly QualityTier[] = ["high", "balanced", "low"];
const PIXEL_RATIO_CAPS: Record<QualityTier, number> = {
  high: 1.75,
  balanced: 1.35,
  low: 1,
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
    return PIXEL_RATIO_CAPS[this.tier];
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
