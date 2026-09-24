import { afterEach, describe, expect, it, vi } from "vitest";
import { Texture, TextureLoader } from "three";
import { AssetManager } from "../../src/core/AssetManager";

afterEach(() => vi.restoreAllMocks());

describe("AssetManager", () => {
  it("shares a texture request and disposes the loaded texture once", async () => {
    const texture = new Texture(document.createElement("img"));
    const dispose = vi.spyOn(texture, "dispose");
    const load = vi.spyOn(TextureLoader.prototype, "loadAsync").mockResolvedValue(texture);
    const assets = new AssetManager();

    const first = assets.loadTexture("/sample.webp");
    const second = assets.loadTexture("/sample.webp");
    expect(first).toBe(second);
    expect(await first).toBe(texture);
    expect(load).toHaveBeenCalledTimes(1);

    assets.dispose();
    assets.dispose();
    expect(dispose).toHaveBeenCalledTimes(1);
    await expect(assets.loadTexture("/another.webp")).rejects.toThrow("disposed");
  });
});
