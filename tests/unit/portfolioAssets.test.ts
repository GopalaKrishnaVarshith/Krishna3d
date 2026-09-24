import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function webpDimensions(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error(`${path} is not a WebP file`);
  }

  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunk = bytes.toString("ascii", offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4);
    const payload = offset + 8;

    if (chunk === "VP8X" && length >= 10) {
      return {
        width: 1 + bytes.readUIntLE(payload + 4, 3),
        height: 1 + bytes.readUIntLE(payload + 7, 3),
      };
    }

    if (chunk === "VP8L" && length >= 5 && bytes[payload] === 0x2f) {
      const b1 = bytes[payload + 1];
      const b2 = bytes[payload + 2];
      const b3 = bytes[payload + 3];
      const b4 = bytes[payload + 4];
      return {
        width: 1 + b1 + ((b2 & 0x3f) << 8),
        height: 1 + ((b2 >> 6) & 0x03) + (b3 << 2) + ((b4 & 0x0f) << 10),
      };
    }

    if (chunk === "VP8 " && length >= 10) {
      const frame = bytes.subarray(payload, payload + length);
      if (frame[3] !== 0x9d || frame[4] !== 0x01 || frame[5] !== 0x2a) {
        throw new Error(`${path} has an invalid VP8 frame header`);
      }
      return {
        width: frame.readUInt16LE(6) & 0x3fff,
        height: frame.readUInt16LE(8) & 0x3fff,
      };
    }

    offset = payload + length + (length % 2);
  }

  throw new Error(`${path} does not contain a supported WebP image chunk`);
}

const asset = (relativePath: string) =>
  join(process.cwd(), "public", relativePath);

describe("portfolio image dimensions", () => {
  it("keeps the portrait at or below a 1024-pixel long edge", () => {
    const { width, height } = webpDimensions(asset("assets/portrait/krishna-portrait.webp"));
    expect(Math.max(width, height)).toBeLessThanOrEqual(1024);
  });

  it("provides company WebPs at least 128 by 128 pixels", () => {
    const logos = ["amgen", "climed", "icon", "iqvia", "pfizer", "practo"];
    for (const logo of logos) {
      const { width, height } = webpDimensions(asset(`assets/companies/${logo}.webp`));
      expect(width, `${logo} width`).toBeGreaterThanOrEqual(128);
      expect(height, `${logo} height`).toBeGreaterThanOrEqual(128);
    }
  });
});
