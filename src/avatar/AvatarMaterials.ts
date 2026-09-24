import {
  ClampToEdgeWrapping,
  DataTexture,
  DoubleSide,
  LinearFilter,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  type Texture,
} from "three";

export interface AvatarMaterials {
  wool: MeshStandardMaterial;
  lapel: MeshStandardMaterial;
  cotton: MeshStandardMaterial;
  skin: MeshStandardMaterial;
  hair: MeshStandardMaterial;
  hairLight: MeshStandardMaterial;
  beard: MeshStandardMaterial;
  leather: MeshStandardMaterial;
  sole: MeshStandardMaterial;
  gold: MeshStandardMaterial;
  glass: MeshPhysicalMaterial;
  face: MeshStandardMaterial;
}

/** A small, per-avatar palette reused by every part of its mesh hierarchy. */
export function createAvatarMaterials(portrait: Texture): AvatarMaterials {
  portrait.colorSpace = SRGBColorSpace;
  const size = 64;
  const mask = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      const feather = Math.min(
        (u - 0.282) / 0.026, (0.718 - u) / 0.026,
        (v - 0.41) / 0.026, (0.765 - v) / 0.026,
      );
      const value = Math.round(Math.max(0, Math.min(1, feather)) * 255);
      const offset = (y * size + x) * 4;
      mask[offset] = 255;
      mask[offset + 1] = value;
      mask[offset + 2] = 255;
      mask[offset + 3] = 255;
    }
  }
  const faceMask = new DataTexture(mask, size, size);
  faceMask.magFilter = LinearFilter;
  faceMask.minFilter = LinearFilter;
  faceMask.wrapS = ClampToEdgeWrapping;
  faceMask.wrapT = ClampToEdgeWrapping;
  faceMask.needsUpdate = true;
  return {
    wool: new MeshStandardMaterial({ color: 0x20335d, roughness: 0.86, flatShading: true }),
    lapel: new MeshStandardMaterial({ color: 0x2a416e, roughness: 0.83, flatShading: true, side: DoubleSide }),
    cotton: new MeshStandardMaterial({ color: 0xf2f0ed, roughness: 0.94, side: DoubleSide }),
    skin: new MeshStandardMaterial({ color: 0xbd8167, roughness: 0.92, flatShading: true }),
    hair: new MeshStandardMaterial({ color: 0x211c20, roughness: 0.96, flatShading: true }),
    hairLight: new MeshStandardMaterial({ color: 0x392b2d, roughness: 0.98, flatShading: true }),
    beard: new MeshStandardMaterial({ color: 0x261d1c, roughness: 1, flatShading: true }),
    leather: new MeshStandardMaterial({ color: 0x593a2b, roughness: 0.46, metalness: 0.04, flatShading: true }),
    sole: new MeshStandardMaterial({ color: 0x251e1d, roughness: 0.88, flatShading: true }),
    gold: new MeshStandardMaterial({ color: 0xc9a675, roughness: 0.3, metalness: 0.82 }),
    glass: new MeshPhysicalMaterial({
      color: 0xe8f4f2,
      roughness: 0.08,
      metalness: 0,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      side: DoubleSide,
    }),
    face: new MeshStandardMaterial({ map: portrait, alphaMap: faceMask, transparent: true, depthWrite: false,
      roughness: 0.98, side: DoubleSide }),
  };
}
