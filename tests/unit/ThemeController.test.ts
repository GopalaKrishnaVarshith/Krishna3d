import { FogExp2, Mesh, MeshStandardMaterial, PointLight, Scene } from "three";
import { describe, expect, it, vi } from "vitest";
import { THEME_PALETTES, ThemeController } from "../../src/world/ThemeController";
import { World } from "../../src/world/World";

function memoryStorage(initial?: string) {
  let value = initial ?? null;
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, next: string) => { value = next; }),
  };
}

describe("ThemeController", () => {
  it("applies the saved daylight world before the first update", () => {
    const scene = new Scene();
    const storage = memoryStorage("day");
    const controller = new ThemeController(scene, { storage });

    expect(controller.theme).toBe("day");
    expect(scene.background).toBe(controller.sky);
    expect(controller.sky.getHex()).toBe(THEME_PALETTES.day.sky);
    expect(scene.fog).toBeInstanceOf(FogExp2);
    expect((scene.fog as FogExp2).color.getHex()).toBe(THEME_PALETTES.day.fog);
    expect((scene.fog as FogExp2).density).toBe(THEME_PALETTES.day.fogDensity);
    expect(controller.ambient.color.getHex()).toBe(THEME_PALETTES.day.ambient);
    expect(controller.ambient.intensity).toBe(THEME_PALETTES.day.ambientIntensity);
    expect(controller.key.color.getHex()).toBe(THEME_PALETTES.day.key);
    expect(controller.key.intensity).toBe(THEME_PALETTES.day.keyIntensity);
    expect(controller.key.shadow.mapSize.width).toBe(2048);
    expect(storage.setItem).not.toHaveBeenCalled();
    controller.dispose();
  });

  it("reduces shadow resolution when adaptive quality drops", () => {
    const scene = new Scene();
    const controller = new ThemeController(scene, { storage: memoryStorage() });

    controller.setQualityTier("balanced");
    expect(controller.key.shadow.mapSize.width).toBe(1024);
    expect(controller.key.shadow.mapSize.height).toBe(1024);
    expect(controller.key.shadow.needsUpdate).toBe(true);

    controller.setQualityTier("low");
    expect(controller.key.shadow.mapSize.width).toBe(512);
    expect(controller.key.shadow.mapSize.height).toBe(512);
    controller.dispose();
  });

  it("transitions one set of world materials and lights between night and day", () => {
    const scene = new Scene();
    const storage = memoryStorage("night");
    const controller = new ThemeController(scene, { storage });
    const material = new MeshStandardMaterial();
    controller.bindMaterial(material, {
      night: { color: 0x172d3d, emissive: 0x0a8c9f, emissiveIntensity: 1.4 },
      day: { color: 0xe8dcc6, emissive: 0x0a8c9f, emissiveIntensity: 0.08 },
    });
    const sky = scene.background;
    const fog = scene.fog;

    expect(material.color.getHex()).toBe(0x172d3d);
    expect(material.emissiveIntensity).toBe(1.4);
    controller.setTheme("day");
    expect(storage.setItem).toHaveBeenCalledWith("krishna-world-theme", "day");
    controller.update(1);

    expect(controller.theme).toBe("day");
    expect(scene.background).toBe(sky);
    expect(scene.fog).toBe(fog);
    expect(controller.sky.getHex()).toBe(THEME_PALETTES.day.sky);
    expect(controller.ambient.intensity).toBe(THEME_PALETTES.day.ambientIntensity);
    expect(controller.key.intensity).toBe(THEME_PALETTES.day.keyIntensity);
    expect(material.color.getHex()).toBe(0xe8dcc6);
    expect(material.emissiveIntensity).toBeCloseTo(0.08);

    controller.setTheme("night");
    controller.update(1);
    expect(controller.theme).toBe("night");
    expect(controller.sky.getHex()).toBe(THEME_PALETTES.night.sky);
    expect(material.emissiveIntensity).toBeCloseTo(1.4);
    controller.dispose();
    material.dispose();
  });

  it("switches theme without animation under reduced motion", () => {
    const scene = new Scene();
    const controller = new ThemeController(scene, { reducedMotion: true, storage: memoryStorage("night") });
    const material = new MeshStandardMaterial();
    controller.bindMaterial(material, {
      night: { color: 0x102030, emissiveIntensity: 1 },
      day: { color: 0xfaf0dd, emissiveIntensity: 0 },
    });
    controller.setTheme("day");

    expect(controller.reducedMotion).toBe(true);
    expect(controller.sky.getHex()).toBe(THEME_PALETTES.day.sky);
    expect(material.color.getHex()).toBe(0xfaf0dd);
    expect(material.emissiveIntensity).toBe(0);
    controller.dispose();
    material.dispose();
  });

  it("themes the actual shared terrain and zone practicals in place", () => {
    const scene = new Scene();
    const world = new World(undefined, { deferZones: true });
    scene.add(world.group);
    const water = world.group.getObjectByName("shared water plane") as Mesh;
    const geometry = water.geometry;
    const material = water.material as MeshStandardMaterial;
    const lantern = world.group.getObjectByName("arrival-approach batched warm lantern heads") as Mesh;
    const lanternMaterial = lantern.material as MeshStandardMaterial;
    const practical = new PointLight(0xffcc88, 2);
    practical.userData.worldThemeLight = { night: 2, day: 0.1 };
    world.group.add(practical);
    const controller = new ThemeController(scene, { reducedMotion: true, storage: memoryStorage("night") });
    controller.bindWorldTerrain(world.group);
    controller.bindSceneMaterials(world.group);

    expect(material.color.getHex()).toBe(0x0b3150);
    expect(lanternMaterial.emissiveIntensity).toBeCloseTo(0.94);
    controller.setTheme("day");
    expect(water.geometry).toBe(geometry);
    expect(water.material).toBe(material);
    expect(material.color.getHex()).toBe(0x2878a4);
    expect(practical.intensity).toBe(0.1);
    expect(lanternMaterial.emissiveIntensity).toBeCloseTo(0.08);
    controller.dispose();
    world.dispose();
  });
});
