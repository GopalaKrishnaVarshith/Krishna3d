import {
  BufferAttribute,
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type BufferGeometry,
  type Texture,
} from "three";

/** Four aligned concept views from the approved turnaround, packed into one small map. */
export function loadTurnaroundMap(): Texture {
  const texture = new TextureLoader().load("/assets/avatar/turnaround-views.webp");
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/**
 * Bind-pose coordinates keep garment and face details attached to animated limbs.
 * The map is sampled on the curved mesh, never drawn as a camera-facing card.
 */
export function bindProjection(mesh: Mesh): void {
  const geometry = mesh.geometry.clone() as BufferGeometry;
  const position = geometry.getAttribute("position");
  const bind = new Float32Array(position.count * 3);
  const point = new Vector3();
  for (let index = 0; index < position.count; index += 1) {
    point.fromBufferAttribute(position, index).applyMatrix4(mesh.matrixWorld);
    point.toArray(bind, index * 3);
  }
  geometry.setAttribute("avatarBind", new BufferAttribute(bind, 3));
  mesh.geometry = geometry;
}

/** The concept views and the high-resolution portrait blend around one 3D surface. */
export function projectedMaterial(base: MeshStandardMaterial, atlas: Texture,
  portrait: Texture, head: boolean, viewAngle: { value: number }): MeshStandardMaterial {
  const material = base.clone();
  const fallback = base.color.clone();
  material.color.set(0xffffff);
  material.vertexColors = false;
  material.map = atlas;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.avatarPortrait = { value: portrait };
    shader.uniforms.avatarAtlas = { value: atlas };
    shader.uniforms.avatarFallback = { value: fallback };
    shader.uniforms.avatarHead = { value: head ? 1 : 0 };
    shader.uniforms.avatarAngle = viewAngle;
    shader.uniforms.avatarDarkLimit = { value: head && fallback.r > 0.25
      ? 1.1 : fallback.r < 0.22 && fallback.g < 0.32
        ? 0.28 : fallback.r < 0.55 ? 0.43 : 1.1 };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>
attribute vec3 avatarBind;
varying vec3 vAvatarBind;
`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
vAvatarBind = avatarBind;`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
uniform sampler2D avatarPortrait;
uniform sampler2D avatarAtlas;
uniform vec3 avatarFallback;
uniform float avatarHead;
uniform float avatarAngle;
uniform float avatarDarkLimit;
varying vec3 vAvatarBind;

vec3 avatarView(float view, vec3 p) {
  float lateral = p.x;
  if (view > 0.5 && view < 1.5) lateral = abs(p.x) * 0.70710678 - p.z * 0.70710678;
  if (view > 1.5 && view < 2.5) lateral = -p.z;
  if (view > 2.5) lateral = -p.x;
  vec2 uv = vec2((view * 512.0 + 256.0 + lateral * 360.0) / 2048.0,
    1.0 - (879.0 - p.y * 360.0) / 1024.0);
  return texture2D(avatarAtlas, uv).rgb;
}

vec3 avatarPortraitView(vec3 p) {
  vec2 uv = vec2((562.0 + p.x * 1450.0) / 1122.0,
    1.0 - (475.0 - (p.y - 2.121) * 1554.0) / 1402.0);
  return texture2D(avatarPortrait, uv).rgb;
}

vec3 avatarColor(vec3 p) {
  float angle = abs(avatarAngle);
  vec3 front = avatarHead > 0.5 ? avatarPortraitView(p) : avatarView(0.0, p);
  vec3 result;
  if (avatarHead < 0.5) {
    if (angle < 0.98) result = front;
    else if (angle < 1.27) result = mix(front, avatarView(2.0, p),
      smoothstep(0.98, 1.27, angle));
    else if (angle < 2.42) result = avatarView(2.0, p);
    else if (angle < 2.72) result = mix(avatarView(2.0, p), avatarView(3.0, p),
      smoothstep(2.42, 2.72, angle));
    else result = avatarView(3.0, p);
  } else if (angle < 0.29) {
    result = front;
  } else if (angle < 0.42) {
    result = mix(front, avatarView(1.0, p), smoothstep(0.29, 0.42, angle));
  } else if (angle < 1.17) {
    result = avatarView(1.0, p);
  } else if (angle < 1.34) {
    result = mix(avatarView(1.0, p), avatarView(2.0, p),
      smoothstep(1.17, 1.34, angle));
  } else if (angle < 2.42) {
    result = avatarView(2.0, p);
  } else if (angle < 2.72) {
    result = mix(avatarView(2.0, p), avatarView(3.0, p),
      smoothstep(2.42, 2.72, angle));
  } else {
    result = avatarView(3.0, p);
  }
  float channelLow = min(result.r, min(result.g, result.b));
  float channelHigh = max(result.r, max(result.g, result.b));
  float grayBackdrop = smoothstep(0.33, 0.52, channelLow)
    * (1.0 - smoothstep(0.04, 0.12, channelHigh - channelLow));
  float lightBackdrop = smoothstep(avatarDarkLimit - 0.08, avatarDarkLimit + 0.02,
    dot(result, vec3(0.2126, 0.7152, 0.0722)));
  return mix(result, avatarFallback, max(grayBackdrop, lightBackdrop));
}`)
      .replace("#include <map_fragment>", `#ifdef USE_MAP
diffuseColor.rgb *= avatarColor(vAvatarBind);
#endif`);
  };
  material.customProgramCacheKey = () => `avatar-projection-${head ? "head" : "body"}`;
  return material;
}
