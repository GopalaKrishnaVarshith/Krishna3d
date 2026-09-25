import {
  BoxGeometry, BufferGeometry, CanvasTexture, CatmullRomCurve3, ConeGeometry,
  CylinderGeometry, DoubleSide, ExtrudeGeometry, FrontSide, Group, InstancedMesh, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, Object3D, PlaneGeometry, PointLight, Shape, SphereGeometry, Texture,
  TorusGeometry, TubeGeometry, TextureLoader, Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { ThemeMaterialStates } from "../ThemeController";
import type { WorldZone } from "../types";

export interface DynamicWorldZone extends WorldZone {
  setReducedMotion(reduced: boolean): void;
}

export interface ZoneOptions {
  reducedMotion?: boolean;
}

export type Point = [number, number, number];

export function v(point: Point): Vector3 { return new Vector3(...point); }

/** Small owned geometry/material kit. A zone can be disposed without touching its neighbours. */
export class ZoneKit {
  readonly group = new Group();
  private readonly geometries = new Set<BufferGeometry>();
  private readonly materials = new Set<MeshStandardMaterial | MeshBasicMaterial>();
  private readonly textures = new Set<Texture>();
  private readonly geometryCache = new Map<string, BufferGeometry>();

  constructor(name: string, x: number, z: number) {
    this.group.name = name;
    this.group.position.set(x, 0, z);
  }

  material(name: string, night: number, day: number, options: {
    metalness?: number; roughness?: number; emissive?: number;
    nightEmission?: number; dayEmission?: number; transparent?: boolean;
    nightOpacity?: number; dayOpacity?: number; doubleSided?: boolean;
  } = {}): MeshStandardMaterial {
    const material = new MeshStandardMaterial({
      name, color: night, metalness: options.metalness ?? 0,
      roughness: options.roughness ?? 0.75,
      emissive: options.emissive ?? 0,
      emissiveIntensity: options.nightEmission ?? 0,
      transparent: options.transparent ?? false,
      opacity: options.nightOpacity ?? 1,
      side: options.doubleSided ? DoubleSide : FrontSide,
      flatShading: true,
      depthWrite: !options.transparent,
    });
    const states: ThemeMaterialStates = {
      night: { color: night, emissive: options.emissive,
        emissiveIntensity: options.nightEmission ?? 0, opacity: options.nightOpacity ?? 1 },
      day: { color: day, emissive: options.emissive,
        emissiveIntensity: options.dayEmission ?? 0, opacity: options.dayOpacity ?? 1 },
    };
    material.userData.worldTheme = states;
    this.materials.add(material);
    return material;
  }

  add(name: string, geometry: BufferGeometry, material: MeshStandardMaterial | MeshBasicMaterial,
    point: Point = [0, 0, 0], parent: Object3D = this.group): Mesh {
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(...point);
    // Major architecture casts; small inlays/icons remain readable without a second shadow pass.
    mesh.castShadow = !material.transparent &&
      /footing|foundation|floor|terrace|roof|canopy|arch|pier|structural|stone podium|portal concentric/.test(name);
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  box(name: string, size: Point, material: MeshStandardMaterial,
    point: Point = [0, 0, 0], parent: Object3D = this.group): Mesh {
    const key = `box:${size.join(",")}`;
    return this.add(name, this.cache(key, () => new BoxGeometry(...size)), material, point, parent);
  }

  bevel(name: string, size: Point, material: MeshStandardMaterial,
    point: Point = [0, 0, 0], parent: Object3D = this.group, bevel = 0.06): Mesh {
    const key = `bevel:${size.join(",")}:${bevel}`;
    return this.add(name, this.cache(key, () => bevelBox(size, bevel)), material, point, parent);
  }

  cylinder(name: string, top: number, bottom: number, height: number,
    material: MeshStandardMaterial, point: Point = [0, 0, 0],
    segments = 12, parent: Object3D = this.group): Mesh {
    const key = `cylinder:${top}:${bottom}:${height}:${segments}`;
    return this.add(name, this.cache(key, () => new CylinderGeometry(top, bottom, height, segments)),
      material, point, parent);
  }

  cone(name: string, radius: number, height: number, material: MeshStandardMaterial,
    point: Point = [0, 0, 0], segments = 8, parent: Object3D = this.group): Mesh {
    const key = `cone:${radius}:${height}:${segments}`;
    return this.add(name, this.cache(key, () => new ConeGeometry(radius, height, segments)),
      material, point, parent);
  }

  sphere(name: string, radius: number, material: MeshStandardMaterial,
    point: Point = [0, 0, 0], parent: Object3D = this.group, segments = 12): Mesh {
    const key = `sphere:${radius}:${segments}`;
    return this.add(name, this.cache(key, () => new SphereGeometry(radius, segments, Math.max(6, segments / 2))),
      material, point, parent);
  }

  torus(name: string, radius: number, tube: number, material: MeshStandardMaterial,
    point: Point = [0, 0, 0], parent: Object3D = this.group, segments = 64): Mesh {
    const key = `torus:${radius}:${tube}:${segments}`;
    return this.add(name, this.cache(key, () => new TorusGeometry(radius, tube, 6, segments)),
      material, point, parent);
  }

  beam(name: string, start: Point, end: Point, radius: number, material: MeshStandardMaterial,
    parent: Object3D = this.group): Mesh {
    const a = v(start);
    const b = v(end);
    const mesh = this.cylinder(name, radius, radius, a.distanceTo(b), material,
      [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2], 8, parent);
    mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), b.sub(a).normalize());
    return mesh;
  }

  curve(name: string, points: Point[], radius: number, material: MeshStandardMaterial,
    parent: Object3D = this.group, closed = false): Mesh {
    const curve = new CatmullRomCurve3(points.map(v), closed, "centripetal");
    return this.add(name, this.own(new TubeGeometry(curve, Math.max(20, points.length * 7), radius, 6, closed)),
      material, [0, 0, 0], parent);
  }

  /** One authored text plane; only semantic HTML needs to carry longer readable copy. */
  text(name: string, lines: string[], width: number, height: number,
    point: Point, parent: Object3D = this.group, style: {
      background?: string; foreground?: string; accent?: string; fontSize?: number;
    } = {}): Mesh {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = Math.max(256, Math.round(1024 * height / width));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D unavailable for world signage");
    context.fillStyle = style.background ?? "#102c3b";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = style.accent ?? "#cbb174";
    context.lineWidth = 12;
    context.strokeRect(22, 22, canvas.width - 44, canvas.height - 44);
    context.fillStyle = style.foreground ?? "#f1ede3";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `600 ${style.fontSize ?? 62}px Georgia, serif`;
    lines.forEach((line, index) => {
      const lineY = canvas.height * (index + 1) / (lines.length + 1);
      context.fillText(line, canvas.width / 2, lineY, canvas.width - 96);
    });
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = "srgb";
    this.textures.add(texture);
    const material = new MeshBasicMaterial({ map: texture, transparent: false, side: DoubleSide });
    this.materials.add(material);
    const mesh = this.add(name, this.own(new PlaneGeometry(width, height)), material, point, parent);
    mesh.castShadow = false;
    return mesh;
  }

  image(name: string, url: string, width: number, height: number, point: Point,
    parent: Object3D = this.group): Mesh {
    const texture = new TextureLoader().load(url);
    texture.colorSpace = "srgb";
    this.textures.add(texture);
    const material = new MeshBasicMaterial({ map: texture, transparent: true, side: DoubleSide });
    this.materials.add(material);
    const mesh = this.add(name, this.own(new PlaneGeometry(width, height)), material, point, parent);
    mesh.castShadow = false;
    return mesh;
  }

  lamp(name: string, color: number, nightIntensity: number, dayIntensity: number,
    distance: number, point: Point, parent: Object3D = this.group): PointLight {
    const lamp = new PointLight(color, nightIntensity, distance, 2);
    lamp.name = name;
    lamp.position.set(...point);
    lamp.userData.worldThemeLight = { night: nightIntensity, day: dayIntensity };
    parent.add(lamp);
    return lamp;
  }

  /** Merge static opaque detail within each transform/interaction group. */
  optimizeDrawCalls(): void {
    const animated = /fountain illuminated ripple|fountain crystalline compass|vault inspectable evidence prism|faceted regulatory node|time beacon/;
    const visit = (parent: Object3D): void => {
      for (const child of [...parent.children]) if (child instanceof Group) visit(child);
      const buckets = new Map<string, Mesh[]>();
      for (const child of parent.children) {
        if (!(child instanceof Mesh) || child instanceof InstancedMesh ||
          !(child.material instanceof MeshStandardMaterial) || child.material.transparent ||
          animated.test(child.name) || child.onBeforeRender !== Object3D.prototype.onBeforeRender) continue;
        const attributes = Object.keys(child.geometry.attributes).sort().join(",");
        const signature = `${child.material.uuid}:${attributes}:${child.geometry.index ? "indexed" : "plain"}`;
        const bucket = buckets.get(signature) ?? [];
        bucket.push(child);
        buckets.set(signature, bucket);
      }
      for (const meshes of buckets.values()) {
        if (meshes.length < 2) continue;
        const transformed = meshes.map((mesh) => {
          mesh.updateMatrix();
          return mesh.geometry.clone().applyMatrix4(mesh.matrix);
        });
        const geometry = mergeGeometries(transformed, false);
        for (const temporary of transformed) temporary.dispose();
        if (!geometry) continue;
        const material = meshes[0].material as MeshStandardMaterial;
        const merged = new Mesh(this.own(geometry), material);
        merged.name = `batched ${material.name} detail`;
        merged.castShadow = meshes.some((mesh) => mesh.castShadow);
        merged.receiveShadow = meshes.some((mesh) => mesh.receiveShadow);
        for (const mesh of meshes) parent.remove(mesh);
        parent.add(merged);
      }
    };
    visit(this.group);
    const used = new Set<BufferGeometry>();
    this.group.traverse((object) => {
      if (object instanceof Mesh) used.add(object.geometry);
    });
    for (const geometry of this.geometries) {
      if (used.has(geometry)) continue;
      geometry.dispose();
      this.geometries.delete(geometry);
    }
    for (const [key, geometry] of this.geometryCache)
      if (!used.has(geometry)) this.geometryCache.delete(key);
  }

  own<T extends BufferGeometry>(geometry: T): T { this.geometries.add(geometry); return geometry; }

  dispose(): void {
    this.group.removeFromParent();
    this.group.clear();
    for (const geometry of this.geometries) geometry.dispose();
    for (const material of this.materials) material.dispose();
    for (const texture of this.textures) texture.dispose();
    this.geometries.clear();
    this.materials.clear();
    this.textures.clear();
  }

  private cache(key: string, factory: () => BufferGeometry): BufferGeometry {
    let geometry = this.geometryCache.get(key);
    if (!geometry) { geometry = this.own(factory()); this.geometryCache.set(key, geometry); }
    return geometry;
  }
}

function bevelBox(size: Point, bevel: number): BufferGeometry {
  const [width, height, depth] = size;
  const b = Math.min(bevel, width / 5, height / 5, depth / 5);
  const shape = new Shape();
  const x = width / 2;
  const y = height / 2;
  shape.moveTo(-x + b, -y);
  shape.lineTo(x - b, -y);
  shape.quadraticCurveTo(x, -y, x, -y + b);
  shape.lineTo(x, y - b);
  shape.quadraticCurveTo(x, y, x - b, y);
  shape.lineTo(-x + b, y);
  shape.quadraticCurveTo(-x, y, -x, y - b);
  shape.lineTo(-x, -y + b);
  shape.quadraticCurveTo(-x, -y, -x + b, -y);
  const geometry = new ExtrudeGeometry(shape, { depth: depth - b * 2,
    bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.6,
    bevelSegments: 2, curveSegments: 2, steps: 1 });
  geometry.translate(0, 0, -(depth - b * 2) / 2);
  return geometry;
}

export function makePalette(kit: ZoneKit) {
  return {
    stone: kit.material("warm ivory stone", 0x8798a8, 0xe8e2d3, { roughness: 0.88 }),
    pale: kit.material("soft limestone", 0xb8c4c8, 0xf6f0df, { roughness: 0.86 }),
    dark: kit.material("midnight slate", 0x122f40, 0x667f89, { roughness: 0.54, metalness: 0.24 }),
    deep: kit.material("deep teal enamel", 0x0d3744, 0x347481, { roughness: 0.38, metalness: 0.28 }),
    brass: kit.material("brushed warm brass", 0xb99b5e, 0xbd9a54, { roughness: 0.31, metalness: 0.78 }),
    goldLight: kit.material("brass practical", 0xd8ba7d, 0xbc9c5e,
      { roughness: 0.22, metalness: 0.5, emissive: 0xffb452,
        nightEmission: 1.1, dayEmission: 0.13 }),
    tealLight: kit.material("teal luminance", 0x3cb6c5, 0x59b9d0,
      { roughness: 0.23, metalness: 0.16, emissive: 0x2ccde4,
        nightEmission: 0.74, dayEmission: 0.13 }),
    glass: kit.material("smoked architectural glass", 0x174b5d, 0x9bcad7,
      { roughness: 0.06, metalness: 0.16, transparent: true,
        nightOpacity: 0.24, dayOpacity: 0.2, doubleSided: true }),
    planting: kit.material("mineral vegetation", 0x2b5b51, 0x54825d, { roughness: 0.96 }),
  };
}
