import {
  AmbientLight, Color, DirectionalLight, FogExp2, Material, MeshStandardMaterial, PointLight,
  Object3D, Scene,
} from "three";
import type { QualityTier } from "../core/PerformanceManager";

export type WorldTheme = "night" | "day";

export interface ThemeMaterialState {
  color: number;
  emissive?: number;
  emissiveIntensity?: number;
  opacity?: number;
}

export interface ThemeMaterialStates {
  night: ThemeMaterialState;
  day: ThemeMaterialState;
}

interface ThemePalette {
  sky: number;
  fog: number;
  fogDensity: number;
  ambient: number;
  ambientIntensity: number;
  key: number;
  keyIntensity: number;
  rim: number;
  rimIntensity: number;
}

export const THEME_PALETTES: Record<WorldTheme, ThemePalette> = {
  night: {
    sky: 0x081827, fog: 0x0a2132, fogDensity: 0.0068,
    ambient: 0x8db8d0, ambientIntensity: 1.18,
    key: 0xaacbe0, keyIntensity: 2.0,
    rim: 0x52b8be, rimIntensity: 1.05,
  },
  day: {
    sky: 0xa9d3e8, fog: 0xb8d8e5, fogDensity: 0.0035,
    ambient: 0xe3edf0, ambientIntensity: 2.0,
    key: 0xffe9bd, keyIntensity: 3.1,
    rim: 0x8db9c8, rimIntensity: 0.38,
  },
};

export const THEME_STORAGE_KEY = "krishna-world-theme";
const SHADOW_MAP_SIZE: Record<QualityTier, number> = {
  high: 2048,
  balanced: 1024,
  low: 512,
};

interface ThemeOptions {
  storage?: Pick<Storage, "getItem" | "setItem">;
  reducedMotion?: boolean;
  transitionSeconds?: number;
}

interface MaterialBinding {
  material: MeshStandardMaterial;
  states: ThemeMaterialStates;
  colors: Record<WorldTheme, Color>;
  emissives: Record<WorldTheme, Color>;
  fromColor: Color;
  fromEmissive: Color;
  fromIntensity: number;
  fromOpacity: number;
}

function browserStorage(): Pick<Storage, "getItem" | "setItem"> | undefined {
  try { return typeof localStorage === "undefined" ? undefined : localStorage; }
  catch { return undefined; }
}

/** One scene-wide daylight/night controller; theme changes mutate existing lights and materials. */
export class ThemeController {
  private static readonly paletteColors = {
    night: { sky: new Color(THEME_PALETTES.night.sky), fog: new Color(THEME_PALETTES.night.fog),
      ambient: new Color(THEME_PALETTES.night.ambient), key: new Color(THEME_PALETTES.night.key),
      rim: new Color(THEME_PALETTES.night.rim) },
    day: { sky: new Color(THEME_PALETTES.day.sky), fog: new Color(THEME_PALETTES.day.fog),
      ambient: new Color(THEME_PALETTES.day.ambient), key: new Color(THEME_PALETTES.day.key),
      rim: new Color(THEME_PALETTES.day.rim) },
  };
  readonly sky = new Color();
  readonly fog = new FogExp2(0x000000, 0);
  readonly ambient = new AmbientLight();
  readonly key = new DirectionalLight();
  readonly rim = new DirectionalLight();
  reducedMotion: boolean;
  private readonly storage?: Pick<Storage, "getItem" | "setItem">;
  private readonly transitionSeconds: number;
  private readonly bindings = new Map<MeshStandardMaterial, MaterialBinding>();
  private readonly practicals = new Map<PointLight, { night: number; day: number; from: number }>();
  private readonly originalBackground: Scene["background"];
  private readonly originalFog: Scene["fog"];
  private fromSky = new Color();
  private fromFog = new Color();
  private fromAmbient = new Color();
  private fromKey = new Color();
  private fromRim = new Color();
  private fromFogDensity = 0;
  private fromAmbientIntensity = 0;
  private fromKeyIntensity = 0;
  private fromRimIntensity = 0;
  private elapsed = 0;
  private transitioning = false;
  private currentTheme: WorldTheme;
  private qualityTier: QualityTier = "high";

  constructor(private readonly scene: Scene, options: ThemeOptions = {}) {
    this.storage = options.storage ?? browserStorage();
    this.reducedMotion = options.reducedMotion ?? false;
    this.transitionSeconds = Math.max(0.01, options.transitionSeconds ?? 0.7);
    let saved: string | null = null;
    try { saved = this.storage?.getItem(THEME_STORAGE_KEY) ?? null; } catch { /* blocked storage */ }
    this.currentTheme = saved === "night" ? "night" : "day";
    this.originalBackground = scene.background;
    this.originalFog = scene.fog;
    this.scene.background = this.sky;
    this.scene.fog = this.fog;
    this.ambient.name = "World ambient light";
    this.key.name = "World sun or moon";
    this.rim.name = "World sea rim";
    this.key.position.set(-12, 22, 9);
    this.rim.position.set(9, 11, -13);
    this.key.castShadow = true;
    this.applyShadowQuality();
    this.key.shadow.camera.left = -32;
    this.key.shadow.camera.right = 32;
    this.key.shadow.camera.top = 32;
    this.key.shadow.camera.bottom = -32;
    this.scene.add(this.ambient, this.key, this.rim);
    this.applyExact(this.currentTheme);
  }

  get isTransitioning(): boolean { return this.transitioning; }
  get theme(): WorldTheme { return this.currentTheme; }
  get motionAllowed(): boolean { return !this.reducedMotion; }

  bindMaterial(material: MeshStandardMaterial, states: ThemeMaterialStates): void {
    const binding: MaterialBinding = {
      material, states,
      colors: { night: new Color(states.night.color), day: new Color(states.day.color) },
      emissives: { night: new Color(states.night.emissive ?? 0),
        day: new Color(states.day.emissive ?? 0) },
      fromColor: new Color(), fromEmissive: new Color(),
      fromIntensity: 0, fromOpacity: 1,
    };
    this.bindings.set(material, binding);
    this.applyMaterialExact(binding, this.currentTheme);
  }

  /** Zone materials tagged with `userData.worldTheme` can be bound after the world is built. */
  bindSceneMaterials(root: Object3D = this.scene): void {
    root.traverse((object) => {
      if (object instanceof PointLight) {
        const state = object.userData.worldThemeLight as { night: number; day: number } | undefined;
        if (state && !this.practicals.has(object)) {
          this.practicals.set(object, { ...state, from: object.intensity });
          object.intensity = state[this.currentTheme];
        }
      }
      const drawable = object as Object3D & { material?: Material | Material[] };
      const materials = Array.isArray(drawable.material) ? drawable.material :
        drawable.material ? [drawable.material] : [];
      for (const material of materials) {
        if (!(material instanceof MeshStandardMaterial)) continue;
        const states = material.userData.worldTheme as ThemeMaterialStates | undefined;
        if (states && !this.bindings.has(material)) this.bindMaterial(material, states);
      }
    });
  }

  /** Bind the existing World terrain palette without replacing its shared material instances. */
  bindWorldTerrain(root: Object3D): void {
    const terrain: Array<{ match: (name: string) => boolean; states: ThemeMaterialStates }> = [
      { match: (name) => name === "shared water plane", states: {
        night: { color: 0x0b3150, opacity: 0.82 }, day: { color: 0x2878a4, opacity: 0.78 },
      } },
      { match: (name) => name.endsWith(" clearing"), states: {
        night: { color: 0x536877 }, day: { color: 0xb6b9a6 },
      } },
      { match: (name) => name.includes("layered rock"), states: {
        night: { color: 0x263b50 }, day: { color: 0x556679 },
      } },
      { match: (name) => name.includes(" bridge") || name === "arrival raised plateau", states: {
        night: { color: 0x74889b }, day: { color: 0xe2d8c3 },
      } },
      { match: (name) => name.includes("brass") && !name.includes("foliage"), states: {
        night: { color: 0xb99b5e, emissive: 0x9a6130, emissiveIntensity: 0.16 },
        day: { color: 0xb59655, emissiveIntensity: 0 },
      } },
      { match: (name) => name === "vegetation clusters", states: {
        night: { color: 0x254f50 }, day: { color: 0x3b775e },
      } },
      { match: (name) => name === "tree trunks", states: {
        night: { color: 0x594b47 }, day: { color: 0x6c5a4d },
      } },
    ];
    root.traverse((object) => {
      const mesh = object as Object3D & { material?: Material | Material[] };
      if (!(mesh.material instanceof MeshStandardMaterial) || this.bindings.has(mesh.material)) return;
      const match = terrain.find(({ match: matches }) => matches(object.name));
      if (match) this.bindMaterial(mesh.material, match.states);
    });
  }

  setTheme(theme: WorldTheme): void {
    if (theme === this.currentTheme) return;
    this.currentTheme = theme;
    try { this.storage?.setItem(THEME_STORAGE_KEY, theme); } catch { /* blocked storage */ }
    if (typeof document !== "undefined") document.documentElement.dataset.theme = theme;
    if (this.reducedMotion) {
      this.transitioning = false;
      this.applyExact(theme);
      return;
    }
    this.captureStart();
    this.elapsed = 0;
    this.transitioning = true;
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    if (reduced && this.transitioning) {
      this.transitioning = false;
      this.applyExact(this.currentTheme);
    }
  }

  setQualityTier(tier: QualityTier): void {
    this.qualityTier = tier;
    this.applyShadowQuality();
  }

  update(delta: number): void {
    if (!this.transitioning) return;
    this.elapsed += Math.max(0, Number.isFinite(delta) ? delta : 0);
    const ratio = Math.min(1, this.elapsed / this.transitionSeconds);
    const eased = ratio * ratio * (3 - 2 * ratio);
    const palette = THEME_PALETTES[this.currentTheme];
    const colors = ThemeController.paletteColors[this.currentTheme];
    this.sky.lerpColors(this.fromSky, colors.sky, eased);
    this.fog.color.lerpColors(this.fromFog, colors.fog, eased);
    this.fog.density = this.fromFogDensity + (palette.fogDensity - this.fromFogDensity) * eased;
    this.ambient.color.lerpColors(this.fromAmbient, colors.ambient, eased);
    this.ambient.intensity = this.fromAmbientIntensity +
      (palette.ambientIntensity - this.fromAmbientIntensity) * eased;
    this.key.color.lerpColors(this.fromKey, colors.key, eased);
    this.key.intensity = this.fromKeyIntensity + (palette.keyIntensity - this.fromKeyIntensity) * eased;
    this.rim.color.lerpColors(this.fromRim, colors.rim, eased);
    this.rim.intensity = this.fromRimIntensity + (palette.rimIntensity - this.fromRimIntensity) * eased;
    for (const binding of this.bindings.values()) this.applyMaterialBlend(binding, this.currentTheme, eased);
    for (const [light, state] of this.practicals)
      light.intensity = state.from + (state[this.currentTheme] - state.from) * eased;
    if (ratio >= 1) {
      this.transitioning = false;
      this.applyExact(this.currentTheme);
    }
  }

  dispose(): void {
    this.scene.remove(this.ambient, this.key, this.rim);
    if (this.scene.background === this.sky) this.scene.background = this.originalBackground;
    if (this.scene.fog === this.fog) this.scene.fog = this.originalFog;
    this.bindings.clear();
    this.practicals.clear();
  }

  private captureStart(): void {
    this.fromSky.copy(this.sky);
    this.fromFog.copy(this.fog.color);
    this.fromAmbient.copy(this.ambient.color);
    this.fromKey.copy(this.key.color);
    this.fromRim.copy(this.rim.color);
    this.fromFogDensity = this.fog.density;
    this.fromAmbientIntensity = this.ambient.intensity;
    this.fromKeyIntensity = this.key.intensity;
    this.fromRimIntensity = this.rim.intensity;
    for (const binding of this.bindings.values()) {
      binding.fromColor.copy(binding.material.color);
      binding.fromEmissive.copy(binding.material.emissive);
      binding.fromIntensity = binding.material.emissiveIntensity;
      binding.fromOpacity = binding.material.opacity;
    }
    for (const [light, state] of this.practicals) state.from = light.intensity;
  }

  private applyExact(theme: WorldTheme): void {
    const palette = THEME_PALETTES[theme];
    this.sky.setHex(palette.sky);
    this.fog.color.setHex(palette.fog);
    this.fog.density = palette.fogDensity;
    this.ambient.color.setHex(palette.ambient);
    this.ambient.intensity = palette.ambientIntensity;
    this.key.color.setHex(palette.key);
    this.key.intensity = palette.keyIntensity;
    this.rim.color.setHex(palette.rim);
    this.rim.intensity = palette.rimIntensity;
    for (const binding of this.bindings.values()) this.applyMaterialExact(binding, theme);
    for (const [light, state] of this.practicals) light.intensity = state[theme];
    if (typeof document !== "undefined") document.documentElement.dataset.theme = theme;
  }

  private applyShadowQuality(): void {
    const size = SHADOW_MAP_SIZE[this.qualityTier];
    this.key.shadow.mapSize.set(size, size);
    this.key.shadow.needsUpdate = true;
  }

  private applyMaterialExact(binding: MaterialBinding, theme: WorldTheme): void {
    const state = binding.states[theme];
    binding.material.color.setHex(state.color);
    binding.material.emissive.setHex(state.emissive ?? 0x000000);
    binding.material.emissiveIntensity = state.emissiveIntensity ?? 0;
    binding.material.opacity = state.opacity ?? 1;
  }

  private applyMaterialBlend(binding: MaterialBinding, theme: WorldTheme, ratio: number): void {
    const state = binding.states[theme];
    binding.material.color.lerpColors(binding.fromColor, binding.colors[theme], ratio);
    binding.material.emissive.lerpColors(binding.fromEmissive, binding.emissives[theme], ratio);
    binding.material.emissiveIntensity = binding.fromIntensity +
      ((state.emissiveIntensity ?? 0) - binding.fromIntensity) * ratio;
    binding.material.opacity = binding.fromOpacity + ((state.opacity ?? 1) - binding.fromOpacity) * ratio;
  }
}
