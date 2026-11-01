import { describe, expect, it } from "vitest";
import { encodeQr, qrToPath } from "../qr";

// Pola kotak pojok (finder) 7x7: tepi gelap, ring dalam terang, tengah 3x3 gelap
function expectFinder(m: boolean[][], x0: number, y0: number) {
  for (let dy = 0; dy < 7; dy++) {
    for (let dx = 0; dx < 7; dx++) {
      const edge = dx === 0 || dx === 6 || dy === 0 || dy === 6;
      const center = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
      expect(m[y0 + dy][x0 + dx]).toBe(edge || center);
    }
  }
}

describe("encodeQr", () => {
  it("teks pendek -> versi 1 (21x21) dengan 3 kotak pojok", () => {
    const m = encodeQr("A");
    expect(m).toHaveLength(21);
    expect(m.every((row) => row.length === 21)).toBe(true);
    expectFinder(m, 0, 0);
    expectFinder(m, 14, 0);
    expectFinder(m, 0, 14);
  });

  it("garis timing selang-seling & modul gelap tetap ada", () => {
    const m = encodeQr("hello");
    for (let i = 8; i < 13; i++) {
      expect(m[6][i]).toBe(i % 2 === 0);
      expect(m[i][6]).toBe(i % 2 === 0);
    }
    expect(m[21 - 8][8]).toBe(true);
  });

  it("versi naik mengikuti panjang teks", () => {
    expect(encodeQr("x".repeat(17))).toHaveLength(21); // muat di versi 1
    expect(encodeQr("x".repeat(18))).toHaveLength(25); // versi 2
    expect(encodeQr("x".repeat(300))).toHaveLength(61); // versi 11
  });

  it("isi QR toko (JSON url + anon key ~280 byte) jadi 61x61", () => {
    const key = "eyJ" + "a".repeat(205);
    const text = JSON.stringify({ app: "temanpos", url: "https://abcdefghijklmnopqrst.supabase.co", key });
    expect(encodeQr(text)).toHaveLength(61);
  });

  it("hasil selalu sama untuk teks yang sama, beda untuk teks lain", () => {
    expect(encodeQr("temanpos")).toEqual(encodeQr("temanpos"));
    expect(encodeQr("temanpos")).not.toEqual(encodeQr("temanpoS"));
  });

  it("teks terlalu panjang ditolak", () => {
    expect(() => encodeQr("x".repeat(3000))).toThrow(/terlalu panjang/);
  });

  it("karakter non-ASCII tetap bisa dibuat", () => {
    expect(() => encodeQr("Toko Kopi ☕ — Palembang")).not.toThrow();
  });
});

describe("qrToPath", () => {
  it("ukuran kanvas = ukuran QR + quiet zone, path hanya memuat modul gelap", () => {
    const m = [
      [true, false],
      [false, true],
    ];
    const { path, size } = qrToPath(m, 4);
    expect(size).toBe(10);
    expect(path).toBe("M4 4h1v1h-1zM5 5h1v1h-1z");
  });
});
