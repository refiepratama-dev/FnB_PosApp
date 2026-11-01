/**
 * Pembuat QR Code kecil (tanpa library tambahan), khusus untuk QR toko.
 * - Mode byte (teks UTF-8), tingkat koreksi error L, versi 1-40 dipilih otomatis.
 * - Fungsi murni (tanpa React Native) supaya bisa dites.
 * Standar: ISO/IEC 18004. Tabel koreksi error sama dengan yang dipakai pustaka QR umum.
 */

type Grid = boolean[][];

// Indeks = versi (0 tidak dipakai). Hanya tingkat koreksi L.
const ECC_CODEWORDS_PER_BLOCK = [
  -1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30,
  30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
];
const NUM_ERROR_CORRECTION_BLOCKS = [
  -1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19,
  19, 20, 21, 22, 24, 25,
];

const FORMAT_BITS_L = 1; // kode tingkat koreksi L pada informasi format
const MIN_VERSION = 1;
const MAX_VERSION = 40;

// ---------------------------------------------------------------- Ukuran & kapasitas

function numRawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

function numDataCodewords(version: number): number {
  return (
    Math.floor(numRawDataModules(version) / 8) -
    ECC_CODEWORDS_PER_BLOCK[version] * NUM_ERROR_CORRECTION_BLOCKS[version]
  );
}

function charCountBits(version: number): number {
  return version < 10 ? 8 : 16;
}

// ---------------------------------------------------------------- Teks -> byte

function toUtf8(text: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
        i++;
      }
    }
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    else
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
  }
  return bytes;
}

// ---------------------------------------------------------------- Reed-Solomon (GF(256), polinomial 0x11D)

function gfMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsDivisor(degree: number): number[] {
  const result: number[] = new Array(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMultiply(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result: number[] = new Array(divisor.length).fill(0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coef, i) => {
      result[i] ^= gfMultiply(coef, factor);
    });
  }
  return result;
}

// ---------------------------------------------------------------- Data -> codeword (+ koreksi error)

function buildCodewords(bytes: number[], version: number): number[] {
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };

  push(0b0100, 4); // mode byte
  push(bytes.length, charCountBits(version));
  for (const b of bytes) push(b, 8);

  const capacityBits = numDataCodewords(version) * 8;
  push(0, Math.min(4, capacityBits - bits.length)); // terminator
  push(0, (8 - (bits.length % 8)) % 8); // rapikan ke batas byte
  for (let pad = 0xec; bits.length < capacityBits; pad ^= 0xec ^ 0x11) push(pad, 8);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    data.push(byte);
  }

  // Bagi ke blok, tambahkan koreksi error tiap blok, lalu selang-seling
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[version];
  const blockEccLen = ECC_CODEWORDS_PER_BLOCK[version];
  const rawCodewords = Math.floor(numRawDataModules(version) / 8);
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);

  const divisor = rsDivisor(blockEccLen);
  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const chunk = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
    k += chunk.length;
    const ecc = rsRemainder(chunk, divisor);
    if (i < numShortBlocks) chunk.push(0); // penanda posisi, dilewati saat selang-seling
    blocks.push(chunk.concat(ecc));
  }

  const result: number[] = [];
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((block, j) => {
      if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i]);
    });
  }
  return result;
}

// ---------------------------------------------------------------- Gambar pola pada matriks

function alignmentPositions(version: number, size: number): number[] {
  if (version === 1) return [];
  const numAlign = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result = [6];
  for (let pos = size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
  return result;
}

function newGrid(size: number): Grid {
  return Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
}

function drawFormatBits(modules: Grid, isFunction: Grid, size: number, mask: number) {
  const data = (FORMAT_BITS_L << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const bit = (i: number) => ((bits >>> i) & 1) !== 0;
  const set = (x: number, y: number, dark: boolean) => {
    modules[y][x] = dark;
    isFunction[y][x] = true;
  };

  for (let i = 0; i <= 5; i++) set(8, i, bit(i));
  set(8, 7, bit(6));
  set(8, 8, bit(7));
  set(7, 8, bit(8));
  for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));

  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
  set(8, size - 8, true); // modul gelap tetap
}

function drawFunctionPatterns(modules: Grid, isFunction: Grid, size: number, version: number) {
  const set = (x: number, y: number, dark: boolean) => {
    modules[y][x] = dark;
    isFunction[y][x] = true;
  };

  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }

  const finder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, dist !== 2 && dist !== 4);
      }
    }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);

  const align = alignmentPositions(version, size);
  const last = align.length - 1;
  for (let i = 0; i < align.length; i++) {
    for (let j = 0; j < align.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) set(align[i] + dx, align[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  drawFormatBits(modules, isFunction, size, 0); // sementara, ditimpa setelah mask dipilih

  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >>> i) & 1) !== 0;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      set(a, b, dark);
      set(b, a, dark);
    }
  }
}

function drawCodewords(modules: Grid, isFunction: Grid, size: number, codewords: number[]) {
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFunction[y][x] && i < codewords.length * 8) {
          modules[y][x] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
          i++;
        }
      }
    }
  }
}

// ---------------------------------------------------------------- Mask & penalti

function maskApplies(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0: return (x + y) % 2 === 0;
    case 1: return y % 2 === 0;
    case 2: return x % 3 === 0;
    case 3: return (x + y) % 3 === 0;
    case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
    case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
}

function applyMask(modules: Grid, isFunction: Grid, size: number, mask: number) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!isFunction[y][x] && maskApplies(mask, x, y)) modules[y][x] = !modules[y][x];
    }
  }
}

const FINDER_LIKE = [
  [true, false, true, true, true, false, true, false, false, false, false],
  [false, false, false, false, true, false, true, true, true, false, true],
];

function penalty(modules: Grid, size: number): number {
  let score = 0;

  // Garis dengan warna sama berurutan (baris dan kolom) + pola mirip finder
  for (const vertical of [false, true]) {
    for (let a = 0; a < size; a++) {
      const line: boolean[] = [];
      for (let b = 0; b < size; b++) line.push(vertical ? modules[b][a] : modules[a][b]);

      let run = 1;
      for (let b = 1; b <= size; b++) {
        if (b < size && line[b] === line[b - 1]) {
          run++;
        } else {
          if (run >= 5) score += 3 + (run - 5);
          run = 1;
        }
      }
      for (let b = 0; b + 11 <= size; b++) {
        for (const pattern of FINDER_LIKE) {
          if (pattern.every((v, k) => line[b + k] === v)) score += 40;
        }
      }
    }
  }

  // Blok 2x2 warna sama
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = modules[y][x];
      if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) score += 3;
    }
  }

  // Keseimbangan modul gelap
  let dark = 0;
  for (const row of modules) for (const cell of row) if (cell) dark++;
  const total = size * size;
  score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;

  return score;
}

// ---------------------------------------------------------------- API

/**
 * Teks -> matriks QR (true = modul gelap). Baris pertama = atas.
 * Melempar Error kalau teks terlalu panjang untuk QR.
 */
export function encodeQr(text: string): boolean[][] {
  const bytes = toUtf8(text);

  let version = MIN_VERSION;
  while (version <= MAX_VERSION && 4 + charCountBits(version) + bytes.length * 8 > numDataCodewords(version) * 8) {
    version++;
  }
  if (version > MAX_VERSION) throw new Error("Teks terlalu panjang untuk dibuat QR");

  const size = version * 4 + 17;
  const modules = newGrid(size);
  const isFunction = newGrid(size);

  drawFunctionPatterns(modules, isFunction, size, version);
  drawCodewords(modules, isFunction, size, buildCodewords(bytes, version));

  // Pilih mask dengan penalti paling kecil
  let bestMask = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    applyMask(modules, isFunction, size, mask);
    drawFormatBits(modules, isFunction, size, mask);
    const score = penalty(modules, size);
    if (score < bestScore) {
      bestScore = score;
      bestMask = mask;
    }
    applyMask(modules, isFunction, size, mask); // batalkan
  }
  applyMask(modules, isFunction, size, bestMask);
  drawFormatBits(modules, isFunction, size, bestMask);

  return modules;
}

/**
 * Matriks -> data path SVG (satu path berisi semua modul gelap) + ukuran kanvas
 * termasuk quiet zone (tepi putih) selebar `border` modul.
 *
 *   <Svg viewBox={`0 0 ${size} ${size}`}><Path d={path} fill="#000" /></Svg>
 */
export function qrToPath(matrix: boolean[][], border = 4): { path: string; size: number } {
  const parts: string[] = [];
  matrix.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) parts.push(`M${x + border} ${y + border}h1v1h-1z`);
    });
  });
  return { path: parts.join(""), size: matrix.length + border * 2 };
}
