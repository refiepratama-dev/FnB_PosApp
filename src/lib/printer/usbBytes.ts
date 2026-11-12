/**
 * Mengubah teks struk (hasil buildReceipt / buildTestPage) jadi byte ESC/POS untuk printer USB.
 * Fungsi murni (tanpa React Native) supaya mudah dites.
 *
 * Teks struk hanya berisi karakter ASCII + perintah kontrol (< 0x80), jadi 1 karakter = 1 byte.
 * Hasilnya sama dengan yang dikirim library Bluetooth: init, code page cp850, isi struk, feed 4 baris, potong kertas.
 */

const ESC = 0x1b;
const GS = 0x1d;

/** Isi teks -> byte. Karakter di luar ASCII diganti "?" (seharusnya sudah dibersihkan oleh sanitize()). */
export function textToBytes(text: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    bytes.push(code < 0x80 ? code : 0x3f);
  }
  return bytes;
}

export function buildUsbPayload(text: string, options: { feedLines?: number; cut?: boolean } = {}): Uint8Array {
  const { feedLines = 4, cut = true } = options;
  const bytes: number[] = [
    ESC, 0x40, // ESC @   : reset printer
    ESC, 0x74, 0x02, // ESC t 2 : code page cp850
    ...textToBytes(text),
    ESC, 0x64, feedLines, // ESC d n : maju n baris
  ];
  if (cut) bytes.push(GS, 0x56, 0x01); // GS V 1 : potong kertas (diabaikan printer tanpa pemotong)
  return Uint8Array.from(bytes);
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Byte -> base64 (ditulis sendiri supaya tidak bergantung pada Buffer / btoa). */
export function toBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    out += ALPHABET[(n >> 18) & 63] + ALPHABET[(n >> 12) & 63];
    out += i + 1 < bytes.length ? ALPHABET[(n >> 6) & 63] : "=";
    out += i + 2 < bytes.length ? ALPHABET[n & 63] : "=";
  }
  return out;
}
