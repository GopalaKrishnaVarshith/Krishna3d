import {
  BufferGeometry, CanvasTexture, CylinderGeometry, Group, Material, Mesh,
  MeshBasicMaterial, RingGeometry, Sprite, SpriteMaterial, SRGBColorSpace, Texture, TorusGeometry,
} from "three";
import type { Metric } from "../data/types";

export interface ParsedMetric {
  label: string;
  display: string;
  number: number;
  kind: "percent" | "count";
  approximate: boolean;
  lowerBound: boolean;
}

/** Accept only the published plain count or percent syntax; qualifiers remain in the label. */
export function parseMetric(metric: Metric): ParsedMetric | null {
  const display = metric.value.trim();
  const match = /^(Approx\.\s*)?(\d+(?:\.\d+)?)(%|\+)?$/i.exec(display);
  if (!match) return null;
  const number = Number(match[2]);
  const kind = match[3] === "%" ? "percent" : "count";
  if (!Number.isFinite(number) || number < 0 || (kind === "percent" && number > 100)) return null;
  if (match[1] && kind !== "percent") return null;
  return { label: metric.label, display, number, kind,
    approximate: Boolean(match[1]), lowerBound: match[3] === "+" };
}

/** Small destination display. Geometry never converts a lower bound into an exact total. */
export class MetricVisualization {
  readonly group = new Group();
  metrics: ParsedMetric[] = [];
  private readonly geometries = new Set<BufferGeometry>();
  private readonly materials = new Set<Material>();
  private readonly textures = new Set<Texture>();
  private elapsed = 0;

  constructor() { this.group.name = "published project metrics"; }

  setMetrics(metrics: Metric[]): void {
    this.clear();
    this.metrics = metrics.map(parseMetric).filter((metric): metric is ParsedMetric => metric !== null);
    this.group.userData.metricLabels = this.metrics.map(({ label, display }) => `${label}: ${display}`);
    this.metrics.forEach((metric, index) => {
      const x = (index - (this.metrics.length - 1) / 2) * 1.15;
      const station = new Group();
      station.name = `${metric.label} ${metric.display}`;
      station.position.x = x;
      station.userData.metric = metric;
      this.group.add(station);
      if (metric.kind === "percent") this.percent(station, metric);
      else if (Number.isInteger(metric.number) && metric.number <= 5 && !metric.lowerBound)
        this.markers(station, metric);
      else this.column(station, metric);
      this.label(station, metric);
    });
    // A radial comparison is meaningful only for measures with the same label and unit.
    if (this.metrics.length > 1 && this.metrics.every((metric) =>
      metric.kind === this.metrics[0].kind && metric.label === this.metrics[0].label)) {
      const max = Math.max(...this.metrics.map((metric) => metric.number));
      if (max > 0) this.metrics.forEach((metric, index) => {
        const radius = 0.34 + index * 0.12;
        const arc = new Mesh(this.geometry(new TorusGeometry(radius, 0.012, 5, 32,
          Math.PI * 2 * metric.number / max)), this.material(0xf1c57c));
        arc.name = `${metric.label} radial comparison ${metric.display}`;
        arc.rotation.x = -Math.PI / 2;
        arc.position.y = 0.05 + index * 0.015;
        this.group.add(arc);
      });
    }
  }

  update(delta: number, reducedMotion = false): void {
    if (reducedMotion || this.metrics.length === 0) return;
    this.elapsed += Math.max(0, delta);
    this.group.children.forEach((child, index) => {
      if (child.userData.metric) child.position.y = Math.sin(this.elapsed * 1.1 + index) * 0.015;
    });
  }

  dispose(): void { this.clear(); this.group.removeFromParent(); }

  private percent(station: Group, metric: ParsedMetric): void {
    const background = new Mesh(this.geometry(new TorusGeometry(0.28, 0.025, 6, 64)), this.material(0x355b65));
    background.name = "percent denominator 100";
    station.add(background);
    const arc = new Mesh(this.geometry(new TorusGeometry(0.28, 0.032, 6, 64,
      Math.PI * 2 * metric.number / 100)), this.material(0x65d5d8));
    arc.name = `${metric.display} of 100 percent ring`;
    arc.rotation.z = Math.PI / 2;
    station.add(arc);
  }

  private markers(station: Group, metric: ParsedMetric): void {
    for (let index = 0; index < metric.number; index += 1) {
      const marker = new Mesh(this.geometry(new RingGeometry(0.047, 0.073, 6)), this.material(0xf1c57c));
      marker.name = `${metric.label} counted marker ${index + 1} of ${metric.number}`;
      marker.position.set((index - (metric.number - 1) / 2) * 0.17, 0, 0);
      station.add(marker);
    }
  }

  private column(station: Group, metric: ParsedMetric): void {
    // The column is a category beacon; the displayed value is the quantitative evidence.
    const height = 0.35 + Math.min(0.32, Math.log10(metric.number + 1) * 0.12);
    const column = new Mesh(this.geometry(new CylinderGeometry(0.085, 0.105, height, 8)),
      this.material(0x65d5d8));
    column.name = `${metric.label} rising column ${metric.display}`;
    column.position.y = height / 2 - 0.16;
    station.add(column);
  }

  private label(station: Group, metric: ParsedMetric): void {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 192;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.textAlign = "center";
    context.fillStyle = "#f9dfab";
    context.font = "bold 68px Arial";
    context.fillText(metric.display, 256, 78, 470);
    context.fillStyle = "#d2f1f1";
    context.font = "25px Arial";
    context.fillText(metric.label, 256, 136, 470);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    this.textures.add(texture);
    const material = new SpriteMaterial({ map: texture, transparent: true,
      depthWrite: false, depthTest: false });
    this.materials.add(material);
    const sprite = new Sprite(material);
    sprite.name = `${metric.label}: ${metric.display} visible label`;
    sprite.userData.display = metric.display;
    sprite.position.y = -0.53;
    sprite.scale.set(1.08, 0.405, 1);
    station.add(sprite);
  }

  private geometry<T extends BufferGeometry>(geometry: T): T { this.geometries.add(geometry); return geometry; }
  private material(color: number): MeshBasicMaterial {
    const material = new MeshBasicMaterial({ color, side: 2 });
    this.materials.add(material);
    return material;
  }
  private clear(): void {
    this.group.clear();
    for (const item of this.geometries) item.dispose();
    for (const item of this.materials) item.dispose();
    for (const item of this.textures) item.dispose();
    this.geometries.clear(); this.materials.clear(); this.textures.clear();
    this.metrics = [];
    this.group.userData.metricLabels = [];
  }
}
