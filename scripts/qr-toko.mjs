/**
 * Membuat QR toko untuk toko BARU (dipakai developer saat setup pembeli baru).
 *
 * Cara pakai (dari folder project):
 *   npm run qr-toko
 * lalu isi nama toko, Project URL, dan anon key (Supabase > Project Settings > API).
 *
 * Hasil: folder qr-toko/<nama-toko>/ berisi
 *   - qr.png  -> gambar QR untuk di-scan / dikirim ke pemilik toko
 *   - qr.svg  -> versi tajam untuk dicetak
 *   - kode.txt -> kode manual (cadangan kalau kamera bermasalah)
 * Folder qr-toko/ sudah masuk .gitignore, JANGAN di-commit.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { deflateSync } from "node:zlib";
import { qrMatrix } from "../src/lib/qr.ts";

// ------------------------------------------------------------ input

const rl = createInterface({ input: process.stdin });
const lines = rl[Symbol.asyncIterator]();
const ask = async (q) => {
  process.stdout.write(q);
  const { value } = await lines.next();
  return String(value ?? "").trim();
};

console.log("\n=== Buat QR Toko TemanPOS ===");
console.log("Ambil URL & anon key di Supabase > Project Settings > API\n");

const name = await ask("Nama toko            : ");
let url = await ask("Project URL          : ");
const key = await ask("anon / publishable key: ");
rl.close();

url = url.replace(/\/+$/, "").replace(/\/rest\/v1$/, "");

function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

if (!name) fail("Nama toko wajib diisi.");
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) fail("Project URL harus seperti https://xxxx.supabase.co");
if (key.length < 20) fail("Key terlalu pendek, pastikan disalin lengkap.");

// Tolak service_role / secret key: key itu bisa melewati semua aturan keamanan database!
if (key.startsWith("sb_secret_")) fail("Itu SECRET key. Pakai publishable / anon key.");
try {
  const payload = JSON.parse(Buffer.from(key.split(".")[1] ?? "", "base64url").toString());
  if (payload.role === "service_role") fail("Itu service_role key. Pakai anon key (role: anon).");
} catch {
  // bukan JWT (misal sb_publishable_...), lanjut
}

// ------------------------------------------------------------ cek koneksi

process.stdout.write("\nMengecek koneksi ke Supabase... ");
try {
  const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
  if (!res.ok) fail(`Supabase menolak (status ${res.status}). Cek lagi URL & key.`);
  const table = await fetch(`${url}/rest/v1/store_settings?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (table.status === 404) fail("Tabel store_settings tidak ada. Jalankan dulu semua file supabase/migrations/.");
  console.log("OK ✅");
} catch (e) {
  fail(`Tidak bisa menghubungi Supabase: ${e.message}`);
}

// ------------------------------------------------------------ buat file

const code = JSON.stringify({ app: "temanpos", url, key }); // sama dengan buildStoreCode() di src/lib/connection.ts
const matrix = qrMatrix(code, "M");
const border = 4;
const n = matrix.length + border * 2;
const dark = (x, y) => matrix[y - border]?.[x - border] === true;

// SVG
let path = "";
for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (dark(x, y)) path += `M${x} ${y}h1v1h-1z`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><path d="${path}" fill="#000"/></svg>\n`;

// PNG (hitam-putih, tanpa library tambahan)
function png(scale) {
  const w = n * scale;
  const raw = Buffer.alloc((w + 1) * w);
  for (let py = 0; py < w; py++) {
    raw[py * (w + 1)] = 0;
    for (let px = 0; px < w; px++) raw[py * (w + 1) + 1 + px] = dark(Math.floor(px / scale), Math.floor(py / scale)) ? 0 : 255;
  }
  const crcTable = Array.from({ length: 256 }, (_, i) => {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(w, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // grayscale
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "toko";
const dir = join("qr-toko", slug);
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "qr.png"), png(10));
writeFileSync(join(dir, "qr.svg"), svg);
writeFileSync(join(dir, "kode.txt"), `${code}\n`);

console.log(`\n✅ Selesai! File ada di folder ${dir}`);
console.log("   qr.png   -> kirim ke pemilik toko / scan dari tablet kasir");
console.log("   qr.svg   -> untuk dicetak");
console.log("   kode.txt -> kode manual (cadangan)");
console.log("\n⚠️  Jangan commit folder qr-toko/ dan jangan sebar QR ke orang selain pemilik toko.\n");
