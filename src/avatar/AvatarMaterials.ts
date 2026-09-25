import { CanvasTexture, Color, DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial,
  SRGBColorSpace, type Texture } from "three";

export interface AvatarMaterials {
  wool: MeshStandardMaterial;
  lapel: MeshStandardMaterial;
  cotton: MeshStandardMaterial;
  skin: MeshStandardMaterial;
  skinFace: MeshStandardMaterial;
  skinShade: MeshStandardMaterial;
  eyeWhite: MeshStandardMaterial;
  iris: MeshStandardMaterial;
  hair: MeshStandardMaterial;
  hairMass: MeshStandardMaterial;
  hairLock: MeshStandardMaterial;
  beard: MeshStandardMaterial;
  beardMass: MeshStandardMaterial;
  lip: MeshStandardMaterial;
  leather: MeshStandardMaterial;
  sole: MeshStandardMaterial;
  gold: MeshStandardMaterial;
  glass: MeshPhysicalMaterial;
}

function portraitSkinColor(portrait: Texture): Color {
  const fallback = new Color(0xa96d52);
  const image = portrait.image as (CanvasImageSource & { width: number; height: number }) | undefined;
  if (!image?.width || !image.height) return fallback;
  try {
    const sample = document.createElement("canvas");
    sample.width = sample.height = 1;
    const context = sample.getContext("2d");
    if (!context) return fallback;
    context.drawImage(image, image.width * 0.65, image.height * 0.43, 2, 2, 0, 0, 1, 1);
    const pixel = context.getImageData(0, 0, 1, 1).data;
    const measured = new Color().setRGB(pixel[0] / 255, pixel[1] / 255, pixel[2] / 255,
      SRGBColorSpace);
    return measured.lerp(fallback, 0.76);
  } catch {
    return fallback;
  }
}

/** One restrained palette; the supplied portrait informs complexion without a visible photo decal. */
export function createAvatarMaterials(portrait: Texture): AvatarMaterials {
  const skin = portraitSkinColor(portrait);
  const hairCanvas = document.createElement("canvas");
  hairCanvas.width = hairCanvas.height = 256;
  const hairContext = hairCanvas.getContext("2d");
  if (!hairContext) throw new Error("The avatar hair requires a 2D canvas context");
  hairContext.fillStyle = "#281f1f";
  hairContext.fillRect(0, 0, 256, 256);
  for (let index = 0; index < 8; index += 1) {
    const offset = index * 11;
    hairContext.beginPath();
    hairContext.moveTo(60 + offset, 226);
    hairContext.bezierCurveTo(65 + offset, 164, 111 + offset, 116, 147 + offset, 29);
    hairContext.strokeStyle = index % 2 ? "rgba(139,101,82,0.26)" : "rgba(104,73,65,0.26)";
    hairContext.lineWidth = index % 3 === 0 ? 6 : 3;
    hairContext.stroke();
  }
  const hairTexture = new CanvasTexture(hairCanvas);
  hairTexture.colorSpace = SRGBColorSpace;
  return {
    wool: new MeshStandardMaterial({ color: 0x25365d, roughness: 0.86 }),
    lapel: new MeshStandardMaterial({ color: 0x385078, roughness: 0.83, side: DoubleSide }),
    cotton: new MeshStandardMaterial({ color: 0xeae9e5, roughness: 0.96, side: DoubleSide }),
    skin: new MeshStandardMaterial({ color: skin, roughness: 0.9 }),
    skinFace: new MeshStandardMaterial({ color: skin, roughness: 0.91, vertexColors: true }),
    skinShade: new MeshStandardMaterial({ color: skin.clone().multiplyScalar(0.75), roughness: 0.96 }),
    eyeWhite: new MeshStandardMaterial({ color: 0xdacfc0, roughness: 0.6 }),
    iris: new MeshStandardMaterial({ color: 0x292522, roughness: 0.34 }),
    hair: new MeshStandardMaterial({ color: 0x261f20, roughness: 0.91 }),
    hairMass: new MeshStandardMaterial({ map: hairTexture, roughness: 0.91, vertexColors: true }),
    hairLock: new MeshStandardMaterial({ color: 0x4a3531, roughness: 0.93, side: DoubleSide }),
    beard: new MeshStandardMaterial({ color: 0x332727, roughness: 1, side: DoubleSide }),
    beardMass: new MeshStandardMaterial({ color: 0x423231, roughness: 1, vertexColors: true,
      side: DoubleSide }),
    lip: new MeshStandardMaterial({ color: 0x935b51, roughness: 0.86 }),
    leather: new MeshStandardMaterial({ color: 0x67432d, roughness: 0.45 }),
    sole: new MeshStandardMaterial({ color: 0x302520, roughness: 0.85 }),
    gold: new MeshStandardMaterial({ color: 0xd2b47d, metalness: 0.72, roughness: 0.31 }),
    glass: new MeshPhysicalMaterial({
      color: 0xebf4f2,
      transparent: true,
      opacity: 0.055,
      depthWrite: false,
      roughness: 0.08,
      side: DoubleSide,
    }),
  };
}
