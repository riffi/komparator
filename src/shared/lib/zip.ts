const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function createCrc32Table() {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }

  return table;
}

const crc32Table = createCrc32Table();

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}

function writeUint32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true);
}

function concatUint8Arrays(parts: Uint8Array[]) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
}

export async function zipSingleTextFile(filename: string, content: string) {
  const filenameBytes = textEncoder.encode(filename);
  const body = textEncoder.encode(content);
  const crc = crc32(body);
  const method = 0;

  const localHeader = new Uint8Array(30 + filenameBytes.length);
  const localView = new DataView(localHeader.buffer);
  writeUint32(localView, 0, 0x04034b50);
  writeUint16(localView, 4, 20);
  writeUint16(localView, 6, 0);
  writeUint16(localView, 8, method);
  writeUint16(localView, 10, 0);
  writeUint16(localView, 12, 0);
  writeUint32(localView, 14, crc);
  writeUint32(localView, 18, body.length);
  writeUint32(localView, 22, body.length);
  writeUint16(localView, 26, filenameBytes.length);
  writeUint16(localView, 28, 0);
  localHeader.set(filenameBytes, 30);

  const centralHeader = new Uint8Array(46 + filenameBytes.length);
  const centralView = new DataView(centralHeader.buffer);
  writeUint32(centralView, 0, 0x02014b50);
  writeUint16(centralView, 4, 20);
  writeUint16(centralView, 6, 20);
  writeUint16(centralView, 8, 0);
  writeUint16(centralView, 10, method);
  writeUint16(centralView, 12, 0);
  writeUint16(centralView, 14, 0);
  writeUint32(centralView, 16, crc);
  writeUint32(centralView, 20, body.length);
  writeUint32(centralView, 24, body.length);
  writeUint16(centralView, 28, filenameBytes.length);
  writeUint16(centralView, 30, 0);
  writeUint16(centralView, 32, 0);
  writeUint16(centralView, 34, 0);
  writeUint16(centralView, 36, 0);
  writeUint32(centralView, 38, 0);
  writeUint32(centralView, 42, 0);
  centralHeader.set(filenameBytes, 46);

  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  writeUint32(endView, 0, 0x06054b50);
  writeUint16(endView, 4, 0);
  writeUint16(endView, 6, 0);
  writeUint16(endView, 8, 1);
  writeUint16(endView, 10, 1);
  writeUint32(endView, 12, centralHeader.length);
  writeUint32(endView, 16, localHeader.length + body.length);
  writeUint16(endView, 20, 0);

  return new Blob([concatUint8Arrays([localHeader, body, centralHeader, endRecord])], {
    type: "application/zip",
  });
}

export async function unzipSingleTextFile(file: Blob) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (view.getUint32(0, true) !== 0x04034b50) {
    throw new Error("Invalid ZIP file.");
  }

  const method = view.getUint16(8, true);
  const compressedSize = view.getUint32(18, true);
  const uncompressedSize = view.getUint32(22, true);
  const filenameLength = view.getUint16(26, true);
  const extraLength = view.getUint16(28, true);
  const filenameStart = 30;
  const filenameEnd = filenameStart + filenameLength;
  const dataStart = filenameEnd + extraLength;
  const dataEnd = dataStart + compressedSize;
  const filename = textDecoder.decode(bytes.slice(filenameStart, filenameEnd));

  if (method !== 0) {
    throw new Error("Unsupported ZIP compression method.");
  }

  const payload = bytes.slice(dataStart, dataEnd);
  if (payload.length !== uncompressedSize) {
    throw new Error("ZIP payload size mismatch.");
  }

  return {
    filename,
    content: textDecoder.decode(payload),
  };
}
