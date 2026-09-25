import { Group } from "three";
import type { WorldZone } from "./types";

/** Registry and scene owner for destinations; direct navigation resolves their authored entry. */
export class ZoneManager {
  readonly group = new Group();
  private readonly zones = new Map<string, WorldZone>();
  private active: WorldZone | null = null;

  constructor(private readonly onNavigate?: (zone: WorldZone) => void) {
    this.group.name = "WorldZones";
  }

  get currentZone(): WorldZone | null { return this.active; }
  get ids(): string[] { return [...this.zones.keys()]; }
  get(id: string): WorldZone | undefined { return this.zones.get(id); }

  register(zone: WorldZone): void {
    if (this.zones.has(zone.id)) throw new Error(`Zone already registered: ${zone.id}`);
    this.zones.set(zone.id, zone);
    this.group.add(zone.group);
  }

  navigateTo(zoneId: string): WorldZone {
    const zone = this.zones.get(zoneId);
    if (!zone) throw new Error(`Unknown zone: ${zoneId}`);
    this.active = zone;
    this.onNavigate?.(zone);
    return zone;
  }

  update(delta: number): void { for (const zone of this.zones.values()) zone.update(delta); }

  dispose(): void {
    for (const zone of this.zones.values()) {
      zone.group.removeFromParent();
      zone.dispose();
    }
    this.zones.clear();
    this.active = null;
  }
}
