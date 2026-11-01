import { describe, expect, it } from "vitest";
import { buildStoreCode, parseStoreCode } from "../connection";
import { qrMatrix } from "../qr";

describe("qrMatrix", () => {
  it("ukuran sesuai versi (21 untuk versi 1, +4 tiap naik versi)", () => {
    const small = qrMatrix("hi", "L");
    expect(small.length).toBe(21);
    expect(small.every((row) => row.length === 21)).toBe(true);
    // teks 30 byte tidak muat di versi 1 level M (maks 14 byte)
    expect(qrMatrix("x".repeat(30), "M").length).toBeGreaterThan(21);
  });

  it("pola penanda sudut ada di tiga pojok", () => {
    const m = qrMatrix("TemanPOS", "M");
    const n = m.length;
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      expect(m[oy][ox]).toBe(true); // sudut luar hitam
      expect(m[oy + 1][ox + 1]).toBe(false); // cincin putih
      expect(m[oy + 3][ox + 3]).toBe(true); // pusat hitam
    }
  });

  it("selalu sama untuk teks yang sama", () => {
    expect(qrMatrix("abc")).toEqual(qrMatrix("abc"));
  });

  it("menolak teks yang terlalu panjang", () => {
    expect(() => qrMatrix("x".repeat(3000), "L")).toThrow();
  });

  it("QR toko: isinya bisa dibaca balik oleh parseStoreCode", () => {
    const conn = { url: "https://abcdefghij.supabase.co", anonKey: "k".repeat(40) };
    const code = buildStoreCode(conn);
    expect(() => qrMatrix(code, "L")).not.toThrow();
    expect(parseStoreCode(code)).toEqual(conn);
  });
});
