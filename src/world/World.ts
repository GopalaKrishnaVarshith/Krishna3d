import {
  BufferAttribute, BufferGeometry, CatmullRomCurve3, ConeGeometry, CylinderGeometry, DoubleSide, Group,
  InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, PlaneGeometry, SphereGeometry, TorusGeometry,
  TubeGeometry, Vector3,
  type Material,
} from "three";
import { ZoneManager } from "./ZoneManager";
import type { CollisionCircle, WorldZone } from "./types";
import { createArrivalPlaza } from "./zones/ArrivalPlaza";
import { createAutomationLab } from "./zones/AutomationLab";
import { createEvidenceVault } from "./zones/EvidenceVault";
import { createRegulatoryObservatory } from "./zones/RegulatoryObservatory";
import { createCareerTrail } from "./zones/CareerTrail";
import { createContactPortal } from "./zones/ContactPortal";

export interface WorldZoneHandlers {
  reducedMotion?: boolean;
  onNavigate?: (zoneId: string) => void;
  onCapabilitySelect?: (id: string) => void;
  onProjectSelect?: (id: string) => void;
  onDomainSelect?: (id: string) => void;
  onExperienceSelect?: (id: string) => void;
  onEmail?: (href: string) => void;
  onLinkedIn?: (href: string) => void;
}

interface Island { id: string; x: number; z: number; radius: number }
interface BridgeRoute { id: string; fromX: number; fromZ: number; toX: number; toZ: number; bend: number }
const ISLANDS: Island[] = [
  { id: "plaza", x: 0, z: 0, radius: 5.8 },
  { id: "automation-lab", x: -13, z: 0, radius: 4.5 },
  { id: "evidence-vault", x: 0, z: -14, radius: 4.6 },
  { id: "observatory", x: 13, z: -1, radius: 4.4 },
  { id: "career-trail", x: 10, z: 13, radius: 4.3 },
  { id: "contact-portal", x: -10, z: 13, radius: 4.1 },
];
const CAREER_TERRACES: Island[] = [
  { id: "career-middle", x: 11.7, z: 17.4, radius: 3.15 },
  { id: "career-end", x: 14.2, z: 21.3, radius: 2.9 },
];
const TERRAIN = [...ISLANDS, ...CAREER_TERRACES];
const ROUTES: BridgeRoute[] = [
  ...ISLANDS.slice(1).map((island, index) => ({ id: island.id,
    fromX: 0, fromZ: 0, toX: island.x, toZ: island.z,
    bend: [0.7, -0.55, 0.7, -0.7, 0.65][index] })),
  { id: "arrival-approach", fromX: 0, fromZ: 4, toX: 0, toZ: 10.8, bend: 0 },
  { id: "career-middle", fromX: 10, fromZ: 13, toX: 11.7, toZ: 17.4, bend: -0.25 },
  { id: "career-end", fromX: 11.7, fromZ: 17.4, toX: 14.2, toZ: 21.3, bend: 0.36 },
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

export function bridgePoint(route: BridgeRoute, t: number): { x: number; z: number } {
  const dx = route.toX - route.fromX;
  const dz = route.toZ - route.fromZ;
  const length = Math.hypot(dx, dz);
  const bow = route.bend * Math.sin(Math.PI * t);
  return { x: route.fromX + dx * t - dz / length * bow,
    z: route.fromZ + dz * t + dx / length * bow };
}

function nearestOnRoute(x: number, z: number, route: BridgeRoute): { x: number; z: number; distance: number } {
  let nearestX = route.fromX;
  let nearestZ = route.fromZ;
  let bestSquared = Infinity;
  let previous = bridgePoint(route, 0);
  for (let step = 1; step <= 24; step += 1) {
    const next = bridgePoint(route, step / 24);
    const dx = next.x - previous.x;
    const dz = next.z - previous.z;
    const lengthSquared = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1,
      ((x - previous.x) * dx + (z - previous.z) * dz) / lengthSquared));
    const px = previous.x + dx * t;
    const pz = previous.z + dz * t;
    const squared = (x - px) ** 2 + (z - pz) ** 2;
    if (squared < bestSquared) { bestSquared = squared; nearestX = px; nearestZ = pz; }
    previous = next;
  }
  return { x: nearestX, z: nearestZ, distance: Math.sqrt(bestSquared) };
}

function bridgeNormal(route: BridgeRoute, t: number): { x: number; z: number } {
  const before = bridgePoint(route, Math.max(0, t - 0.004));
  const after = bridgePoint(route, Math.min(1, t + 0.004));
  const dx = after.x - before.x;
  const dz = after.z - before.z;
  const length = Math.hypot(dx, dz);
  return { x: -dz / length, z: dx / length };
}

function bridgeRibbon(route: BridgeRoute): BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let step = 0; step <= 36; step += 1) {
    const t = step / 36;
    const center = bridgePoint(route, t);
    const normal = bridgeNormal(route, t);
    for (const side of [-1, 1]) {
      const x = center.x + normal.x * BRIDGE_HALF_WIDTH * side;
      const z = center.z + normal.z * BRIDGE_HALF_WIDTH * side;
      positions.push(x, SURFACE_Y + 0.018, z, x, -0.18, z);
    }
    if (step < 36) {
      const i = step * 4;
      const j = i + 4;
      indices.push(i, i + 2, j, i + 2, j + 2, j); // walkable top
      indices.push(i, j, i + 1, i + 1, j, j + 1); // right stone edge
      indices.push(i + 2, i + 3, j + 2, j + 2, i + 3, j + 3); // left edge
      indices.push(i + 1, j + 1, i + 3, i + 3, j + 1, j + 3); // underside
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(Float32Array.from(positions), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Navigable terrain and the six authored destinations. */
export class World {
  readonly group = new Group();
  readonly zones: ZoneManager;
  readonly collisionBoundaries: CollisionCircle[] = [];
  private readonly fixedMovementObstacles: CollisionCircle[] = [];
  readonly spawnPoint = new Vector3(0, SURFACE_Y, 9.2);
  private readonly geometries = new Set<BufferGeometry>();
  private readonly materials = new Set<Material>();
  private readonly islandGeometry = this.ownGeometry(irregularDisk());
  private readonly undersideGeometry = this.ownGeometry(new ConeGeometry(1, 2.5, 10));
  private readonly trunkGeometry = this.ownGeometry(new CylinderGeometry(0.07, 0.11, 0.8, 5));
  private readonly parapetGeometry = this.ownGeometry(new CylinderGeometry(0.07, 0.1, 0.68, 8));
  private readonly capGeometry = this.ownGeometry(new SphereGeometry(0.12, 8, 6));
  private readonly foliageGeometry = this.ownGeometry(new ConeGeometry(0.42, 1.45, 7));
  private readonly shrubGeometry = this.ownGeometry(new SphereGeometry(0.4, 6, 4));
  private readonly ground = this.ownMaterial(new MeshStandardMaterial({
    color: 0xb6b9a6, roughness: 0.93, polygonOffset: true,
    polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  }));
  private readonly rock = this.ownMaterial(new MeshStandardMaterial({ color: 0x435665, roughness: 1, flatShading: true }));
  private readonly path = this.ownMaterial(new MeshStandardMaterial({
    color: 0xd1c8ae, roughness: 0.88, polygonOffset: true,
    polygonOffsetFactor: -0.5, polygonOffsetUnits: -1,
  }));
  private readonly brass = this.ownMaterial(new MeshStandardMaterial({ color: 0xb59655, metalness: 0.68, roughness: 0.32 }));
  private readonly water = this.ownMaterial(new MeshStandardMaterial({ color: 0x17495b, metalness: 0.38, roughness: 0.38, transparent: true, opacity: 0.78, side: DoubleSide }));
  private readonly foliage = this.ownMaterial(new MeshStandardMaterial({ color: 0x32665a, roughness: 1, flatShading: true }));
  private readonly bark = this.ownMaterial(new MeshStandardMaterial({ color: 0x6c5a4d, roughness: 1 }));
  private readonly edgeLight = this.ownMaterial(new MeshStandardMaterial({ color: 0x3cb6c5,
    emissive: 0x2ccde4, emissiveIntensity: 0.74, metalness: 0.18, roughness: 0.24 }));
  private readonly lantern = this.ownMaterial(new MeshStandardMaterial({ color: 0xd3b575,
    emissive: 0xffb452, emissiveIntensity: 0.94, metalness: 0.48, roughness: 0.28 }));
  private disposed = false;

  constructor(onNavigate?: (zone: WorldZone) => void, options: { deferZones?: boolean } = {}) {
    this.group.name = "FloatingRegulatoryCampus";
    this.edgeLight.userData.worldTheme = {
      night: { color: 0x3cb6c5, emissive: 0x2ccde4, emissiveIntensity: 0.74 },
      day: { color: 0x64acba, emissive: 0x2ccde4, emissiveIntensity: 0.1 },
    };
    this.lantern.userData.worldTheme = {
      night: { color: 0xd3b575, emissive: 0xffb452, emissiveIntensity: 0.94 },
      day: { color: 0xc09f60, emissive: 0xffb452, emissiveIntensity: 0.08 },
    };
    this.zones = new ZoneManager(onNavigate);
    this.group.add(this.zones.group);
    const water = new Mesh(this.ownGeometry(new PlaneGeometry(260, 260)), this.water);
    water.name = "shared water plane";
    water.rotation.x = -Math.PI / 2;
    water.position.y = WATER_Y;
    this.group.add(water);
    for (const island of ISLANDS) this.createTerrain(island);
    for (const island of CAREER_TERRACES) this.createTerrain(island);
    for (const route of ROUTES) this.createBridge(route);
    this.createPlaza();
    this.createVegetation();
    this.createTerracePlanting();
    this.createMovementObstacles();
    if (!options.deferZones) this.registerZones();
  }

  /** Deferral lets the app paint terrain before destination detail is built. */
  registerZones(handlers: WorldZoneHandlers = {}): void {
    if (this.disposed) throw new Error("Cannot register zones on a disposed World");
    if (this.zones.ids.length) throw new Error("World zones are already registered");
    const { reducedMotion } = handlers;
    this.zones.register(createArrivalPlaza({ reducedMotion, onNavigate: handlers.onNavigate }));
    this.zones.register(createAutomationLab({ reducedMotion,
      onCapabilitySelect: handlers.onCapabilitySelect }));
    this.zones.register(createEvidenceVault({ reducedMotion,
      onProjectSelect: handlers.onProjectSelect }));
    this.zones.register(createRegulatoryObservatory({ reducedMotion,
      onDomainSelect: handlers.onDomainSelect }));
    this.zones.register(createCareerTrail({ reducedMotion,
      onExperienceSelect: handlers.onExperienceSelect }));
    this.zones.register(createContactPortal({ reducedMotion,
      onEmail: handlers.onEmail, onLinkedIn: handlers.onLinkedIn }));
  }

  getHeightAt(x: number, z: number): number {
    return this.isWalkable(x, z) ? SURFACE_Y : WATER_Y;
  }

  isWalkable(x: number, z: number, margin = 0): boolean {
    if (TERRAIN.some((island) => Math.hypot(x - island.x, z - island.z) <= island.radius - margin)) return true;
    return ROUTES.some((route) => nearestOnRoute(x, z, route).distance <= BRIDGE_HALF_WIDTH - margin);
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
      if (this.fixedMovementObstacles.includes(obstacle)) continue;
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
      for (const island of TERRAIN) {
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
      for (const route of ROUTES) {
        const near = nearestOnRoute(result.x, result.z, route);
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
    this.fixedMovementObstacles.length = 0;
  }

  private createTerrain(island: Island): void {
    const surface = new Mesh(this.islandGeometry, this.ground);
    surface.name = `${island.id} clearing`;
    const careerDepth = island.id === "career-middle" ? -0.008 :
      island.id === "career-end" ? -0.012 : 0;
    surface.position.set(island.x, -0.275 + careerDepth, island.z);
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
  }

  private createBridge(route: BridgeRoute): void {
    const bridge = new Mesh(this.ownGeometry(bridgeRibbon(route)), this.path);
    bridge.name = `${route.id} curved walkable bridge`;
    bridge.receiveShadow = true;
    this.group.add(bridge);
    if (route.id === "career-middle" || route.id === "career-end") return;
    const start = route.id === "arrival-approach" ? 0.25 : 0.39;
    const end = route.id === "arrival-approach" ? 0.98 : 0.75;
    for (const side of [-1, 1]) {
      for (const [name, lateral, elevation, radius, material] of [
        ["stone parapet curb", 1.29, 0.12, 0.095, this.path],
        ["brass parapet handrail", 1.29, 0.69, 0.04, this.brass],
        ["teal path light", 1.03, 0.012, 0.018, this.edgeLight],
      ] as const) {
        const points: Vector3[] = [];
        for (let step = 0; step <= 20; step += 1) {
          const t = start + (end - start) * step / 20;
          const center = bridgePoint(route, t);
          const normal = bridgeNormal(route, t);
          points.push(new Vector3(center.x + normal.x * lateral * side,
            elevation, center.z + normal.z * lateral * side));
        }
        const line = new Mesh(this.ownGeometry(new TubeGeometry(
          new CatmullRomCurve3(points), 40, radius, 6, false)), material);
        line.name = `${route.id} ${name} ${side}`;
        this.group.add(line);
      }
    }
    const posts = new InstancedMesh(this.parapetGeometry, this.path, 12);
    const caps = new InstancedMesh(this.capGeometry, this.lantern, 12);
    posts.name = `${route.id} batched parapet posts`;
    caps.name = `${route.id} batched warm lantern heads`;
    const matrix = new Matrix4();
    for (let index = 0; index < 6; index += 1) {
      const t = start + 0.04 + index * (end - start - 0.08) / 5;
      const center = bridgePoint(route, t);
      const normal = bridgeNormal(route, t);
      for (const side of [-1, 1]) {
        const slot = index * 2 + (side + 1) / 2;
        const x = center.x + normal.x * 1.28 * side;
        const z = center.z + normal.z * 1.28 * side;
        posts.setMatrixAt(slot, matrix.identity().setPosition(x, 0.34, z));
        caps.setMatrixAt(slot, matrix.identity().setPosition(x, 0.73, z));
      }
    }
    posts.instanceMatrix.needsUpdate = true;
    caps.instanceMatrix.needsUpdate = true;
    posts.castShadow = true;
    this.group.add(posts, caps);
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
    plateau.position.y = -0.07;
    this.group.add(plateau);
  }

  private createVegetation(): void {
    const positions: Vector3[] = [];
    for (const island of TERRAIN) {
      if (island.id.startsWith("career")) continue;
      for (let i = 0; i < 9; i += 1) {
        const angle = (i / 9) * Math.PI * 2 + island.radius;
        const radius = island.radius * (0.88 + 0.07 * Math.sin(i * 2.4));
        const x = island.x + Math.cos(angle) * radius;
        const z = island.z + Math.sin(angle) * radius;
        if (island.id === "plaza" && z > 2.4 && Math.abs(x) < 2.2) continue;
        if (ROUTES.some((route) => nearestOnRoute(x, z, route).distance < BRIDGE_HALF_WIDTH + 0.5)) continue;
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

  private createTerracePlanting(): void {
    const positions: Vector3[] = [];
    for (const island of TERRAIN) {
      const count = island.id.startsWith("career") ? 25 : 31;
      for (let i = 0; i < count; i += 1) {
        const angle = (i / count) * Math.PI * 2 + island.radius * 0.45;
        const radius = island.radius * (0.84 + 0.06 * Math.sin(i * 3.3));
        const x = island.x + Math.cos(angle) * radius;
        const z = island.z + Math.sin(angle) * radius;
        if (ROUTES.some((route) => nearestOnRoute(x, z, route).distance < BRIDGE_HALF_WIDTH + 0.52)) continue;
        positions.push(new Vector3(x, 0, z));
      }
    }
    const shrubs = new InstancedMesh(this.shrubGeometry, this.foliage, positions.length);
    shrubs.name = "terrace edge planted clusters";
    const transform = new Matrix4();
    positions.forEach((point, index) => {
      const scale = 0.62 + (index % 5) * 0.16;
      transform.makeScale(scale * 1.24, scale * 0.52, scale)
        .setPosition(point.x, 0.19 * scale, point.z);
      shrubs.setMatrixAt(index, transform);
    });
    shrubs.instanceMatrix.needsUpdate = true;
    shrubs.receiveShadow = true;
    this.group.add(shrubs);
  }

  private createMovementObstacles(): void {
    const add = (x: number, z: number, radius: number) => {
      const obstacle = { center: new Vector3(x, 0, z), radius };
      this.fixedMovementObstacles.push(obstacle);
      this.collisionBoundaries.push(obstacle);
    };
    add(1.58, 0.48, 0.55); // Arrival fountain
    for (const x of [-15.0, -13.4, -11.8]) add(x, 0, 0.65); // Lab conveyor
    add(0, -14, 1.11); // Vault inspection station
    for (let index = 0; index < 11; index += 1) {
      const angle = (120 + index * 30) * Math.PI / 180;
      add(Math.cos(angle) * 3.17, -14 + Math.sin(angle) * 3.17, 0.38);
    }
    add(13, -1, 1.17); // Observatory instrument
  }

  private ownGeometry<T extends BufferGeometry>(geometry: T): T { this.geometries.add(geometry); return geometry; }
  private ownMaterial<T extends Material>(material: T): T { this.materials.add(material); return material; }
}
