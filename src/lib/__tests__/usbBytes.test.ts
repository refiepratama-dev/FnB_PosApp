import { describe, expect, it } from "vitest";
import { CMD } from "../printer/escpos";
import { buildUsbPayload, textToBytes, toBase64 } from "../printer/usbBytes";

describe("toBase64", () => {
  it("sama dengan base64 standar untuk berbagai panjang", () => {
    for (const length of [0, 1, 2, 3, 4, 5, 31, 32, 33, 255, 1000]) {
      const bytes = Uint8Array.from({ length }, (_, i) => (i * 37 + 11) % 256);
      expect(toBase64(bytes)).toBe(Buffer.from(bytes).toString("base64"));
    }
  });
});

describe("buildUsbPayload", () => {
  it("diawali init + cp850 dan diakhiri feed + potong", () => {
    const p = Array.from(buildUsbPayload("Halo\n"));
    expect(p.slice(0, 5)).toEqual([0x1b, 0x40, 0x1b, 0x74, 0x02]);
    expect(p.slice(5, 10)).toEqual([0x48, 0x61, 0x6c, 0x6f, 0x0a]);
    expect(p.slice(-6)).toEqual([0x1b, 0x64, 4, 0x1d, 0x56, 0x01]);
  });

  it("tanpa potong kertas kalau cut = false", () => {
    const p = Array.from(buildUsbPayload("x", { cut: false, feedLines: 2 }));
    expect(p.slice(-3)).toEqual([0x1b, 0x64, 2]);
  });

  it("perintah ESC/POS di dalam teks (rata tengah, tebal) ikut utuh", () => {
    const text = `${CMD.alignCenter}${CMD.boldOn}TOKO${CMD.boldOff}\n`;
    const bytes = textToBytes(text);
    expect(bytes.slice(0, 3)).toEqual([0x1b, 0x61, 0x01]);
    expect(bytes.slice(3, 6)).toEqual([0x1b, 0x45, 0x01]);
  });

  it("karakter di luar ASCII jadi tanda tanya", () => {
    expect(textToBytes("é")).toEqual([0x3f]);
  });
});
