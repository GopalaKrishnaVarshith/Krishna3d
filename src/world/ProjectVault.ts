import { BufferGeometry, CylinderGeometry, DoubleSide, EdgesGeometry, Group, LineBasicMaterial,
  LineSegments, Material, Mesh, MeshBasicMaterial, Object3D,
  OctahedronGeometry, TorusGeometry, Vector3 } from "three";
import { portfolioData } from "../data/portfolioData";
import type { Project } from "../data/types";
import type { EventBus, ExperienceEvents } from "../core/EventBus";
import type { InteractiveTarget } from "./types";
import type { MetricVisualization } from "./MetricVisualization";

export interface ProjectVaultAnchors {
  group: Group;
  interactiveObjects: InteractiveTarget[];
  metricMount?: Group;
}

export interface ProjectVaultOptions {
  metrics?: MetricVisualization;
  events?: Pick<EventBus<ExperienceEvents>, "emit">;
}

type Profile = readonly [topRadius: number, bottomRadius: number, height: number, sides: number];
const CATEGORY_PROFILES: Record<string, Profile> = {
  "Regulatory quality": [0.26, 0.34, 1.22, 5],
  "Workflow automation": [0.31, 0.31, 1.17, 6],
  "Operations design": [0.34, 0.30, 1.10, 8],
  "Quality automation": [0.24, 0.34, 1.23, 6],
  "Regulatory data": [0.27, 0.34, 1.25, 8],
  "Pharmacovigilance": [0.33, 0.28, 1.19, 10],
  "Knowledge enablement": [0.19, 0.35, 1.25, 7],
  "Medical content": [0.33, 0.33, 1.08, 4],
  "Product operations": [0.34, 0.24, 1.20, 9],
  "Operations automation": [0.25, 0.35, 1.22, 12],
  "Service design": [0.21, 0.31, 1.12, 5],
};

/** Data binding and active motion for the eleven authored Evidence Vault anchors. */
export class ProjectVault {
  readonly capsules = new Map<string, Object3D>();
  activeProject: Project | null = null;
  private readonly projects = new Map(portfolioData.projects.map((project) => [project.id, project]));
  private readonly accents = new Map<string, Group>();
  private readonly geometries = new Set<BufferGeometry>();
  private readonly materials = new Set<Material>();
  private readonly geometryCache = new Map<string, BufferGeometry>();
  private readonly materialCache = new Map<string, MeshBasicMaterial>();
  private readonly lineMaterialCache = new Map<number, LineBasicMaterial>();
  private readonly originalHousingVisibility = new Map<Object3D, boolean>();
  private readonly position = new Vector3();
  private readonly originalMetricVisibility = new Map<Object3D, boolean>();
  private elapsed = 0;

  constructor(anchors: ProjectVaultAnchors, private readonly options: ProjectVaultOptions = {}) {
    if (options.metrics && anchors.metricMount) {
      for (const child of anchors.metricMount.children) {
        if (child.name === "vault inspectable evidence prism") continue;
        this.originalMetricVisibility.set(child, child.visible);
        child.visible = false;
      }
      options.metrics.group.position.set(0, 1.5, 0.8);
      anchors.metricMount.add(options.metrics.group);
    }
    for (const target of anchors.interactiveObjects) {
      if (!target.id.startsWith("project:")) continue;
      const id = target.id.slice("project:".length);
      const project = this.projects.get(id);
      if (!project || target.object.userData.projectId !== id || this.capsules.has(id)) continue;
      this.capsules.set(id, target.object);
      const housing = target.object.getObjectByName(`${id} glass housing`);
      if (housing) { this.originalHousingVisibility.set(housing, housing.visible); housing.visible = false; }
      const profile = CATEGORY_PROFILES[project.category] ?? [0.3, 0.3, 1.2, 8];
      const color = this.categoryColor(project.category);
      const bodyGeometry = this.cachedGeometry(`body:${project.category}`,
        () => new CylinderGeometry(...profile));
      const body = new Mesh(bodyGeometry, this.cachedMaterial(color, 0.23));
      body.name = `${id} category capsule body`;
      body.userData.category = project.category;
      body.position.y = 1.34;
      target.object.add(body);
      const edgeGeometry = this.cachedGeometry(`edges:${project.category}`,
        () => new EdgesGeometry(bodyGeometry, 1));
      let edgeMaterial = this.lineMaterialCache.get(color);
      if (!edgeMaterial) {
        edgeMaterial = new LineBasicMaterial({ color, transparent: true, opacity: 0.62,
          depthWrite: false });
        this.lineMaterialCache.set(color, edgeMaterial);
        this.materials.add(edgeMaterial);
      }
      const outline = new LineSegments(edgeGeometry, edgeMaterial);
      outline.name = `${id} category capsule silhouette`;
      outline.scale.setScalar(1.01);
      body.add(outline);
      const accent = this.createCategoryAccent(project);
      target.object.add(accent);
      this.accents.set(id, accent);
    }
  }

  open(projectId: string): Project | null {
    const project = this.projects.get(projectId);
    if (!project || !this.capsules.has(projectId)) return null;
    this.activeProject = project;
    this.options.metrics?.setMetrics(project.metrics);
    this.options.events?.emit("project:open", { projectId });
    return project;
  }

  update(delta: number, viewer?: Vector3, reducedMotion = false): void {
    if (reducedMotion || !this.activeProject) return;
    this.elapsed += Math.max(0, delta);
    const active = this.capsules.get(this.activeProject.id);
    if (!active) return;
    const index = portfolioData.projects.findIndex((project) => project.id === this.activeProject?.id);
    for (const offset of [-1, 0, 1]) {
      const project = portfolioData.projects[(index + offset + portfolioData.projects.length)
        % portfolioData.projects.length];
      const accent = this.accents.get(project.id);
      if (!accent) continue;
      const capsule = this.capsules.get(project.id)!;
      if (viewer && capsule.getWorldPosition(this.position).distanceToSquared(viewer) > 100) continue;
      accent.rotation.y += delta * (offset === 0 ? 0.28 : 0.08);
      accent.position.y = 1.08 + Math.sin(this.elapsed * 1.2 + offset) * (offset === 0 ? 0.035 : 0.01);
    }
  }

  dispose(): void {
    this.options.metrics?.group.removeFromParent();
    for (const [object, visible] of this.originalMetricVisibility) object.visible = visible;
    this.originalMetricVisibility.clear();
    for (const [housing, visible] of this.originalHousingVisibility) housing.visible = visible;
    this.originalHousingVisibility.clear();
    for (const [id, capsule] of this.capsules) capsule.getObjectByName(`${id} category capsule body`)?.removeFromParent();
    for (const accent of this.accents.values()) accent.removeFromParent();
    for (const geometry of this.geometries) geometry.dispose();
    for (const material of this.materials) material.dispose();
    this.geometryCache.clear(); this.materialCache.clear(); this.lineMaterialCache.clear();
    this.accents.clear(); this.capsules.clear(); this.activeProject = null;
  }

  private createCategoryAccent(project: Project): Group {
    const accent = new Group();
    accent.name = `${project.id} ${project.category} category accent`;
    accent.position.y = 1.08;
    const color = this.categoryColor(project.category);
    const material = this.cachedMaterial(color, 0.72);
    const segmentCount = project.category.toLowerCase().includes("quality") ? 6 :
      project.category.toLowerCase().includes("data") ? 8 :
      project.category.toLowerCase().includes("pharmacovigilance") ? 12 : 10;
    const ringGeometry = this.cachedGeometry(`ring:${segmentCount}`,
      () => new TorusGeometry(0.4, 0.012, 4, segmentCount));
    const ring = new Mesh(ringGeometry, material);
    ring.name = `${project.category} category ring`;
    ring.rotation.x = -Math.PI / 2;
    accent.add(ring);
    const beaconGeometry = this.cachedGeometry("beacon", () => new OctahedronGeometry(0.045));
    const beacon = new Mesh(beaconGeometry, material);
    beacon.name = `${project.category} category beacon`;
    beacon.position.set(0.4, 0.02, 0);
    accent.add(beacon);
    return accent;
  }

  private categoryColor(category: string): number {
    const value = category.toLowerCase();
    if (value.includes("quality") || value.includes("regulatory")) return 0x68d0d8;
    if (value.includes("safety") || value.includes("pharmacovigilance")) return 0xe1b477;
    if (value.includes("content") || value.includes("knowledge")) return 0x9daae7;
    if (value.includes("operations")) return 0x8fcbb1;
    return 0xcab7de;
  }

  private cachedGeometry<T extends BufferGeometry>(key: string, create: () => T): T {
    let geometry = this.geometryCache.get(key) as T | undefined;
    if (!geometry) {
      geometry = create();
      this.geometryCache.set(key, geometry);
      this.geometries.add(geometry);
    }
    return geometry;
  }

  private cachedMaterial(color: number, opacity: number): MeshBasicMaterial {
    const key = `${color}:${opacity}`;
    let material = this.materialCache.get(key);
    if (!material) {
      material = new MeshBasicMaterial({ color, transparent: true, opacity,
        side: DoubleSide, depthWrite: false });
      this.materialCache.set(key, material);
      this.materials.add(material);
    }
    return material;
  }
}
