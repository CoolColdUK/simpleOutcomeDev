import {deflateSync} from 'node:zlib';

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value;
  }
  data.forEach((byte) => {
    crc = table[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function writeChunk(type: string, data: Uint8Array): Uint8Array {
  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, data.length);
  const typeBytes = new TextEncoder().encode(type);
  const crcInput = new Uint8Array(typeBytes.length + data.length);
  crcInput.set(typeBytes, 0);
  crcInput.set(data, typeBytes.length);
  const crcBytes = new Uint8Array(4);
  new DataView(crcBytes.buffer).setUint32(0, crc32(crcInput));
  const chunk = new Uint8Array(4 + typeBytes.length + data.length + 4);
  chunk.set(length, 0);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  chunk.set(crcBytes, 8 + data.length);
  return chunk;
}

/** Solid-color 3:4 cover raster for EPUB when the user has not uploaded a cover. */
export default function buildBookPlaceholderCoverPng(
  width = 1600,
  height = 2560,
  rgb: readonly [number, number, number] = [0x2d, 0x24, 0x19],
): Uint8Array {
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = new Uint8Array(height * (1 + width * 3));
  const [r, g, b] = rgb;
  for (let row = 0; row < height; row += 1) {
    const offset = row * (1 + width * 3);
    raw[offset] = 0;
    for (let col = 0; col < width; col += 1) {
      const px = offset + 1 + col * 3;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }
  const idat = deflateSync(raw);
  const parts = [signature, writeChunk('IHDR', ihdr), writeChunk('IDAT', idat), writeChunk('IEND', new Uint8Array(0))];
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const png = new Uint8Array(total);
  let cursor = 0;
  parts.forEach((part) => {
    png.set(part, cursor);
    cursor += part.length;
  });
  return png;
}
