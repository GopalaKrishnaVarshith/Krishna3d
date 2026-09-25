import {
  BoxGeometry, BufferAttribute, ConeGeometry, CylinderGeometry, DoubleSide, Group,
  InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, PlaneGeometry, TorusGeometry, Vector3,
  type BufferGeometry, type Material,
} from "three";
import { ZoneManager } from "./ZoneManager";
import type { CollisionCircle, WorldZone } from "./types";

interface Island { id: string; x: number; z: number; radius: number }
const ISLANDS: Island[] = [
  { id: "plaza", x: 0, z: 0, radius: 5.8 },
  { id: "automation-lab", x: -13, z: 0, radius: 4.5 },
  { id: "evidence-vault", x: 0, z: -14, radius: 4.6 },
  { id: "observatory", x: 13, z: -1, radius: 4.4 },
  { id: "career-trail", x: 10, z: 13, radius: 4.3 },
  { id: "contact-portal", x: -10, z: 13, radius: 4.1 },
];
const BRIDGE_HALF_WIDTH = 1.35;
const SURFACE_Y = 0;
const WATER_Y = -3.2;

function irregularDisk(): CylinderGeometry {
  const geometry = new CylinderGeometry(1, 0.91, 0.55, 16, 1);
  const positions = geometry.getAttribute("position") as BufferAttribute;
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const angle = Math.atan2(z, x);
    const variation = 1 + 0.055 * Math.sin(angle * 5 + 0.3) + 0.035 * Math.cos(angle * 9);
    positions.setX(i, x * variation);
    positions.setZ(i, z * variation);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function nearestOnSegment(x: number, z: number, island: Island): { x: number; z: number; distance: number } {
  const denominator = island.x * island.x + island.z * island.z;
  const progress = denominator === 0 ? 0 : Math.max(0, Math.min(1, (x * island.x + z * island.z) / denominator));
  const px = island.x * progress;
  const pz = island.z * progress;
  return { x: px, z: pz, distance: Math.hypot(x - px, z - pz) };
}

/** Navigable terrain shell. Task 7 can fill the registered zone groups with architecture. */
export class World {
  readonly group = new Group();
  readonly zones: ZoneManager;
  readonly collisionBoundaries: CollisionCircle[] = [];
  readonly spawnPoint = new Vector3(0, SURFACE_Y, 3.7);
  private readonly geometries = new Set<BufferGeometry>();
  private readonly materials = new Set<Material>();
  private readonly islandGeometry = this.ownGeometry(irregularDisk());
  private readonly undersideGeometry = this.ownGeometry(new ConeGeometry(1, 2.5, 10));
  private readonly bridgeGeometry = this.ownGeometry(new BoxGeometry(1, 0.16, 1));
  private readonly inlayGeometry = this.ownGeometry(new BoxGeometry(1, 0.018, 0.025));
  private readonly trunkGeometry = this.ownGeometry(new CylinderGeometry(0.07, 0.11, 0.8, 5));
  private readonly foliageGeometry = this.ownGeometry(new ConeGeometry(0.42, 1.45, 7));
  private readonly ground = this.ownMaterial(new MeshStandardMaterial({ color: 0xb6b9a6, roughness: 0.93 }));
  private readonly rock = this.ownMaterial(new MeshStandardMaterial({ color: 0x435665, roughness: 1, flatShading: true }));
  private readonly path = this.ownMaterial(new MeshStandardMaterial({ color: 0xd1c8ae, roughness: 0.88 }));
  private readonly brass = this.ownMaterial(new MeshStandardMaterial({ color: 0xb59655, metalness: 0.68, roughness: 0.32 }));
  private readonly water = this.ownMaterial(new MeshStandardMaterial({ color: 0x17495b, metalness: 0.38, roughness: 0.38, transparent: true, opacity: 0.78, side: DoubleSide }));
  private readonly foliage = this.ownMaterial(new MeshStandardMaterial({ color: 0x32665a, roughness: 1, flatShading: true }));
  private readonly bark = this.ownMaterial(new MeshStandardMaterial({ color: 0x6c5a4d, roughness: 1 }));
  private disposed = false;

  constructor(onNavigate?: (zone: WorldZone) => void) {
    this.group.name = "FloatingRegulatoryCampus";
    this.zones = new ZoneManager(onNavigate);
    this.group.add(this.zones.group);
    const water = new Mesh(this.ownGeometry(new PlaneGeometry(90, 90)), this.water);
    water.name = "shared water plane";
    water.rotation.x = -Math.PI / 2;
    water.position.y = WATER_Y;
    this.group.add(water);
    for (const island of ISLANDS) this.createIsland(island);
    for (const island of ISLANDS.slice(1)) this.createBridge(island);
    this.createPlaza();
    this.createVegetation();
  }

  getHeightAt(x: number, z: number): number {
    return this.isWalkable(x, z) ? SURFACE_Y : WATER_Y;
  }

  isWalkable(x: number, z: number, margin = 0): boolean {
    if (ISLANDS.some((island) => Math.hypot(x - island.x, z - island.z) <= island.radius - margin)) return true;
    return ISLANDS.slice(1).some((island) => nearestOnSegment(x, z, island).distance <= BRIDGE_HALF_WIDTH - margin);
  }

  /** Nearest distance along an eye-to-camera ray that intersects a tree volume. */
  getCameraObstructionDistance(from: Vector3, to: Vector3): number | null {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const horizontalLengthSquared = dx * dx + dz * dz;
    const totalLength = from.distanceTo(to);
    if (totalLength === 0) return null;
    let nearest = Infinity;
    for (const obstacle of this.collisionBoundaries) {
      const radius = obstacle.radius + 0.35;
      const ox = from.x - obstacle.center.x;
      const oz = from.z - obstacle.center.z;
      const c = ox * ox + oz * oz - radius * radius;
      let entry: number;
      let exit: number;
      if (horizontalLengthSquared < 1e-10) {
        if (c > 0) continue;
        entry = 0;
        exit = 1;
      } else {
        const b = 2 * (ox * dx + oz * dz);
        const discriminant = b * b - 4 * horizontalLengthSquared * c;
        if (discriminant < 0) continue;
        const root = Math.sqrt(discriminant);
        entry = (-b - root) / (2 * horizontalLengthSquared);
        exit = (-b + root) / (2 * horizontalLengthSquared);
      }
      if (Math.abs(dy) < 1e-10) {
        if (from.y < obstacle.center.y - 0.2 || from.y > obstacle.center.y + 3) continue;
      } else {
        const lower = (obstacle.center.y - 0.2 - from.y) / dy;
        const upper = (obstacle.center.y + 3 - from.y) / dy;
        entry = Math.max(entry, Math.min(lower, upper));
        exit = Math.min(exit, Math.max(lower, upper));
      }
      entry = Math.max(entry, 0);
      exit = Math.min(exit, 1);
      if (entry <= exit) nearest = Math.min(nearest, entry * totalLength);
    }
    return Number.isFinite(nearest) ? nearest : null;
  }

  /** Project proposed movement onto a walkable island or bridge and repel circular obstacles. */
  constrainPosition(position: Vector3, radius = 0.34): Vector3 {
    const result = this.projectToWalkable(position.clone(), radius);
    for (let pass = 0; pass < 3; pass += 1) {
      let moved = false;
      for (const obstacle of this.collisionBoundaries) {
        const dx = result.x - obstacle.center.x;
        const dz = result.z - obstacle.center.z;
        const distance = Math.hypot(dx, dz);
        const limit = obstacle.radius + radius;
        if (distance >= limit - 1e-8) continue;
        const unitX = distance > 1e-10 ? dx / distance : 1;
        const unitZ = distance > 1e-10 ? dz / distance : 0;
        let candidate = new Vector3(obstacle.center.x + unitX * limit, SURFACE_Y,
          obstacle.center.z + unitZ * limit);
        if (!this.isWalkable(candidate.x, candidate.z, radius) || !this.isClear(candidate, radius)) {
          let best: Vector3 | null = null;
          let bestScore = Infinity;
          const preferredAngle = Math.atan2(unitZ, unitX);
          for (let step = 0; step < 32; step += 1) {
            const angle = preferredAngle + step * Math.PI * 2 / 32;
            const option = new Vector3(obstacle.center.x + Math.cos(angle) * limit,
              SURFACE_Y, obstacle.center.z + Math.sin(angle) * limit);
            if (!this.isWalkable(option.x, option.z, radius) || !this.isClear(option, radius)) continue;
            const score = option.distanceToSquared(result);
            if (score < bestScore) { best = option; bestScore = score; }
          }
          if (best) candidate = best;
        }
        result.copy(candidate);
        moved = true;
      }
      this.projectToWalkable(result, radius);
      if (!moved) break;
    }
    result.y = SURFACE_Y;
    return result;
  }

  private isClear(point: Vector3, radius: number): boolean {
    return this.collisionBoundaries.every((obstacle) =>
      Math.hypot(point.x - obstacle.center.x, point.z - obstacle.center.z)
      >= obstacle.radius + radius - 1e-8);
  }

  private projectToWalkable(result: Vector3, radius: number): Vector3 {
    if (!this.isWalkable(result.x, result.z, radius)) {
      let bestX = 0;
      let bestZ = 0;
      let bestDistance = Infinity;
      for (const island of ISLANDS) {
        const dx = result.x - island.x;
        const dz = result.z - island.z;
        const length = Math.hypot(dx, dz);
        const limit = Math.max(0, island.radius - radius);
        const scale = length > limit && length > 0 ? limit / length : 1;
        const px = island.x + dx * scale;
        const pz = island.z + dz * scale;
        const distance = Math.hypot(result.x - px, result.z - pz);
        if (distance < bestDistance) { bestDistance = distance; bestX = px; bestZ = pz; }
      }
      for (const island of ISLANDS.slice(1)) {
        const near = nearestOnSegment(result.x, result.z, island);
        const distance = Math.hypot(result.x - near.x, result.z - near.z);
        const limit = Math.max(0, BRIDGE_HALF_WIDTH - radius);
        const scale = distance > limit && distance > 0 ? limit / distance : 1;
        const px = near.x + (result.x - near.x) * scale;
        const pz = near.z + (result.z - near.z) * scale;
        const gap = Math.hypot(result.x - px, result.z - pz);
        if (gap < bestDistance) { bestDistance = gap; bestX = px; bestZ = pz; }
      }
      result.set(bestX, SURFACE_Y, bestZ);
    }
    result.y = SURFACE_Y;
    return result;
  }

  update(delta: number): void { this.zones.update(delta); }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.zones.dispose();
    this.group.removeFromParent();
    this.group.clear();
    for (const geometry of this.geometries) geometry.dispose();
    for (const material of this.materials) material.dispose();
    this.collisionBoundaries.length = 0;
  }

  private createIsland(island: Island): void {
    const surface = new Mesh(this.islandGeometry, this.ground);
    surface.name = `${island.id} clearing`;
    surface.position.set(island.x, -0.275, island.z);
    surface.scale.set(island.radius, 1, island.radius);
    surface.receiveShadow = true;
    this.group.add(surface);
    for (let layer = 0; layer < 3; layer += 1) {
      const rock = new Mesh(this.undersideGeometry, this.rock);
      rock.name = `${island.id} layered rock ${layer + 1}`;
      rock.position.set(island.x + layer * 0.16, -1.0 - layer * 0.5, island.z - layer * 0.12);
      const factor = 0.76 - layer * 0.22;
      rock.scale.set(island.radius * factor, 0.42, island.radius * factor);
      rock.rotation.y = layer * 0.35;
      rock.castShadow = true;
      this.group.add(rock);
    }
    const zoneGroup = new Group();
    zoneGroup.name = `${island.id} zone`;
    zoneGroup.position.set(island.x, 0, island.z);
    const entry = new Vector3(island.x * 0.78, SURFACE_Y, island.z * 0.78);
    const zone: WorldZone = { id: island.id, group: zoneGroup, entryPoint: entry,
      cameraComposition: { position: entry.clone().add(new Vector3(0, 4.2, 6)),
        target: entry.clone().add(new Vector3(0, 1.4, 0)), durationMs: 850 },
      interactiveObjects: [], update: () => undefined, dispose: () => undefined };
    this.zones.register(zone);
  }

  private createBridge(island: Island): void {
    const length = Math.hypot(island.x, island.z);
    const angle = Math.atan2(island.x, island.z);
    const bridge = new Mesh(this.bridgeGeometry, this.path);
    bridge.name = `plaza to ${island.id} bridge`;
    bridge.position.set(island.x / 2, -0.08, island.z / 2);
    bridge.rotation.y = angle;
    bridge.scale.set(BRIDGE_HALF_WIDTH * 2, 1, length);
    bridge.receiveShadow = true;
    this.group.add(bridge);
    for (const edge of [-1, 1]) {
      const line = new Mesh(this.inlayGeometry, this.brass);
      line.name = `${island.id} brass path inlay`;
      line.position.set(island.x / 2 + Math.cos(angle) * edge * 0.95, 0.014,
        island.z / 2 - Math.sin(angle) * edge * 0.95);
      line.rotation.y = angle - Math.PI / 2;
      line.scale.x = length;
      this.group.add(line);
    }
  }

  private createPlaza(): void {
    for (const radius of [2.2, 3.3, 4.4]) {
      const ring = new Mesh(this.ownGeometry(new TorusGeometry(radius, 0.035, 4, 64)), this.brass);
      ring.name = "arrival plaza brass ring";
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.03;
      this.group.add(ring);
    }
    const plateau = new Mesh(this.ownGeometry(new CylinderGeometry(2.05, 2.2, 0.14, 32)), this.path);
    plateau.name = "arrival raised plateau";
    plateau.position.y = 0.015;
    this.group.add(plateau);
  }

  private createVegetation(): void {
    const positions: Vector3[] = [];
    for (const island of ISLANDS) {
      for (let i = 0; i < 9; i += 1) {
        const angle = (i / 9) * Math.PI * 2 + island.radius;
        const radius = island.radius * (0.72 + 0.12 * Math.sin(i * 2.4));
        const x = island.x + Math.cos(angle) * radius;
        const z = island.z + Math.sin(angle) * radius;
        if (island.id === "plaza" && z > 2.4 && Math.abs(x) < 2.2) continue;
        if (nearestOnSegment(x, z, island).distance < BRIDGE_HALF_WIDTH + 0.5) continue;
        positions.push(new Vector3(x, 0, z));
      }
    }
    const foliage = new InstancedMesh(this.foliageGeometry, this.foliage, positions.length);
    const trunks = new InstancedMesh(this.trunkGeometry, this.bark, positions.length);
    foliage.name = "vegetation clusters";
    trunks.name = "tree trunks";
    const transform = new Matrix4();
    positions.forEach((point, i) => {
      const scale = 0.7 + (i % 4) * 0.16;
      transform.makeScale(scale, scale, scale).setPosition(point.x, 0.75 * scale, point.z);
      foliage.setMatrixAt(i, transform);
      transform.makeScale(scale, scale, scale).setPosition(point.x, 0.28 * scale, point.z);
      trunks.setMatrixAt(i, transform);
      this.collisionBoundaries.push({ center: point, radius: 0.24 * scale });
    });
    foliage.instanceMatrix.needsUpdate = true;
    trunks.instanceMatrix.needsUpdate = true;
    foliage.castShadow = true;
    this.group.add(foliage, trunks);
  }

  private ownGeometry<T extends BufferGeometry>(geometry: T): T { this.geometries.add(geometry); return geometry; }
  private ownMaterial<T extends Material>(material: T): T { this.materials.add(material); return material; }
}
