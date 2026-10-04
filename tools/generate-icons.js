// tools/generate-icons.js
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ -1) >>> 0;
}

function makePng(size) {
  // RGBA buffer
  const width = size;
  const height = size;
  const rawData = Buffer.alloc(height * (1 + width * 4));

  const center = size / 2;
  const radius = size * 0.44;
  const innerRadius = size * 0.28;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Gradient from vibrant violet to neon cyan
        const t = (x + y) / (2 * size);
        const r = Math.round(112 * (1 - t) + 14 * t);
        const g = Math.round(72 * (1 - t) + 165 * t);
        const b = Math.round(232 * (1 - t) + 233 * t);

        // Search lens ring highlight
        const isRing = Math.abs(dist - innerRadius) < Math.max(1, size * 0.08);
        const handleX = center + innerRadius * 0.5;
        const handleY = center + innerRadius * 0.5;
        const isHandle = (x >= handleX && x <= handleX + size * 0.25 &&
                          Math.abs((x - handleX) - (y - handleY)) < Math.max(1, size * 0.07) &&
                          dist <= radius * 0.85);

        if (isRing || isHandle) {
          rawData[offset++] = 255;
          rawData[offset++] = 255;
          rawData[offset++] = 255;
          rawData[offset++] = 240;
        } else {
          // Antialiased border
          const edgeAlpha = dist > radius - 1 ? Math.round(255 * (radius - dist)) : 230;
          rawData[offset++] = r;
          rawData[offset++] = g;
          rawData[offset++] = b;
          rawData[offset++] = Math.max(0, Math.min(255, edgeAlpha));
        }
      } else {
        // Transparent outside circle
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crcBuf = Buffer.alloc(4);
    const checksum = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(checksum, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // ColorType 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk("IHDR", ihdr);
  const idatChunk = makeChunk("IDAT", deflated);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.resolve("icons");
fs.mkdirSync(iconsDir, { recursive: true });

for (const size of [16, 32, 48, 96, 128]) {
  const pngBuf = makePng(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), pngBuf);
  console.log(`Generated icon-${size}.png (${pngBuf.length} bytes)`);
}
