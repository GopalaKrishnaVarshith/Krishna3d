import { BufferGeometry, Group, Material, Mesh, MeshBasicMaterial, Object3D,
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

/** Data binding and active motion for the eleven authored Evidence Vault anchors. */
export class ProjectVault {
  readonly capsules = new Map<string, Object3D>();
  activeProject: Project | null = null;
  private readonly projects = new Map(portfolioData.projects.map((project) => [project.id, project]));
  private readonly accents = new Map<string, Group>();
  private readonly geometries = new Set<BufferGeometry>();
  private readonly materials = new Set<Material>();
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
    for (const accent of this.accents.values()) accent.removeFromParent();
    for (const geometry of this.geometries) geometry.dispose();
    for (const material of this.materials) material.dispose();
    this.accents.clear(); this.capsules.clear(); this.activeProject = null;
  }

  private createCategoryAccent(project: Project): Group {
    const accent = new Group();
    accent.name = `${project.id} ${project.category} category accent`;
    accent.position.y = 1.08;
    const color = this.categoryColor(project.category);
    const material = new MeshBasicMaterial({ color, transparent: true, opacity: 0.72 });
    this.materials.add(material);
    const segmentCount = project.category.toLowerCase().includes("quality") ? 6 :
      project.category.toLowerCase().includes("data") ? 8 :
      project.category.toLowerCase().includes("pharmacovigilance") ? 12 : 10;
    const ringGeometry = new TorusGeometry(0.4, 0.012, 4, segmentCount);
    this.geometries.add(ringGeometry);
    const ring = new Mesh(ringGeometry, material);
    ring.name = `${project.category} category ring`;
    ring.rotation.x = -Math.PI / 2;
    accent.add(ring);
    const beaconGeometry = new OctahedronGeometry(0.045);
    this.geometries.add(beaconGeometry);
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
}
