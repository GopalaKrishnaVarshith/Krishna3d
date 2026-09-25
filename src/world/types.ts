import type { Group, Object3D, Vector3 } from "three";

export interface CameraComposition {
  position: Vector3;
  target: Vector3;
  durationMs: number;
  fov?: number;
}

export interface InteractiveTarget {
  id: string;
  object: Object3D;
  label: string;
  activate(): void;
}

export interface WorldZone {
  id: string;
  group: Group;
  entryPoint: Vector3;
  cameraComposition: CameraComposition;
  interactiveObjects: InteractiveTarget[];
  update(delta: number): void;
  dispose(): void;
}

export interface CollisionCircle {
  center: Vector3;
  radius: number;
}
