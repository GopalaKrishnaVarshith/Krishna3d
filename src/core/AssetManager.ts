import { Texture, TextureLoader } from "three";

export class AssetManager {
  private readonly loader = new TextureLoader();
  private readonly textures = new Map<string, Promise<Texture>>();
  private readonly loadedTextures = new Set<Texture>();
  private disposed = false;

  loadTexture(url: string): Promise<Texture> {
    if (this.disposed) return Promise.reject(new Error("AssetManager has been disposed"));

    const cached = this.textures.get(url);
    if (cached) return cached;

    const request = this.loader.loadAsync(url).then(
      (texture) => {
        if (this.disposed) {
          texture.dispose();
          throw new Error("AssetManager was disposed while loading a texture");
        }
        this.loadedTextures.add(texture);
        return texture;
      },
    ).catch((error: unknown) => {
      this.textures.delete(url);
      throw error;
    });
    this.textures.set(url, request);
    return request;
  }

  owns(texture: Texture): boolean {
    return this.loadedTextures.has(texture);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const texture of this.loadedTextures) texture.dispose();
    this.loadedTextures.clear();
    this.textures.clear();
  }
}
