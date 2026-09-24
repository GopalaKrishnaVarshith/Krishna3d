import {
  CanvasTexture,
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
  const size = 1024;
  const atlas = document.createElement("canvas");
  atlas.width = atlas.height = size;
  const layer = document.createElement("canvas");
  layer.width = layer.height = size;
  const context = atlas.getContext("2d");
  const layerContext = layer.getContext("2d");
  if (!context || !layerContext) throw new Error("The avatar face requires a 2D canvas context");
  context.fillStyle = "#b98469";
  context.fillRect(0, 0, size, size);

  const image = portrait.image as CanvasImageSource & { width: number; height: number };
  const dx = size * 0.32;
  const dy = size * 0.18;
  const dw = size * 0.36;
  const dh = size * 0.78;
  layerContext.drawImage(image, image.width * 0.27, image.height * 0.205,
    image.width * 0.46, image.height * 0.42, dx, dy, dw, dh);
  layerContext.globalCompositeOperation = "destination-in";
  const horizontal = layerContext.createLinearGradient(dx, 0, dx + dw, 0);
  horizontal.addColorStop(0, "rgba(255,255,255,0)");
  horizontal.addColorStop(0.14, "white");
  horizontal.addColorStop(0.86, "white");
  horizontal.addColorStop(1, "rgba(255,255,255,0)");
  layerContext.fillStyle = horizontal;
  layerContext.fillRect(dx, dy, dw, dh);
  const vertical = layerContext.createLinearGradient(0, dy, 0, dy + dh);
  vertical.addColorStop(0, "rgba(255,255,255,0)");
  vertical.addColorStop(0.07, "white");
  vertical.addColorStop(0.93, "white");
  vertical.addColorStop(1, "rgba(255,255,255,0)");
  layerContext.fillStyle = vertical;
  layerContext.fillRect(dx, dy, dw, dh);
  context.drawImage(layer, 0, 0);
  const faceAtlas = new CanvasTexture(atlas);
  faceAtlas.colorSpace = SRGBColorSpace;
  faceAtlas.minFilter = LinearFilter;
  faceAtlas.magFilter = LinearFilter;
  faceAtlas.generateMipmaps = false;
  return {
    wool: new MeshStandardMaterial({ color: 0x20335d, roughness: 0.86, flatShading: true }),
    lapel: new MeshStandardMaterial({ color: 0x2a416e, roughness: 0.83, flatShading: true, side: DoubleSide }),
    cotton: new MeshStandardMaterial({ color: 0xf2f0ed, roughness: 0.94, side: DoubleSide }),
    skin: new MeshStandardMaterial({ color: 0xb98469, roughness: 0.94 }),
    hair: new MeshStandardMaterial({ color: 0x211c20, roughness: 0.96, flatShading: true }),
    hairLight: new MeshStandardMaterial({ color: 0x392b2d, roughness: 0.98, flatShading: true }),
    beard: new MeshStandardMaterial({ color: 0x382b26, roughness: 1, flatShading: true, side: DoubleSide }),
    leather: new MeshStandardMaterial({ color: 0x593a2b, roughness: 0.46, metalness: 0.04, flatShading: true }),
    sole: new MeshStandardMaterial({ color: 0x251e1d, roughness: 0.88, flatShading: true }),
    gold: new MeshStandardMaterial({ color: 0xc9a675, roughness: 0.3, metalness: 0.82 }),
    glass: new MeshPhysicalMaterial({
      color: 0xe8f4f2,
      roughness: 0.08,
      metalness: 0,
      transparent: true,
      opacity: 0.035,
      depthWrite: false,
      side: DoubleSide,
    }),
    face: new MeshStandardMaterial({ map: faceAtlas, roughness: 0.98, side: DoubleSide }),
  };
}
