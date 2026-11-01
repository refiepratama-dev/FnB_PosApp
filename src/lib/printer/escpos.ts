/**
 * Perintah ESC/POS dasar + helper teks untuk printer thermal.
 * File ini murni (tanpa React Native) supaya mudah dites.
 *
 * Perintah disisipkan langsung ke dalam teks yang dikirim ke printText().
 * Semua karakter kontrol < 0x80, jadi aman lewat code page cp850.
 */

const ESC = "\x1b";
const GS = "\x1d";

export const CMD = {
  alignLeft: `${ESC}a\x00`,
  alignCenter: `${ESC}a\x01`,
  alignRight: `${ESC}a\x02`,
  boldOn: `${ESC}E\x01`,
  boldOff: `${ESC}E\x00`,
  /** Huruf 2x tinggi & 2x lebar (jumlah karakter per baris jadi setengah). */
  bigOn: `${GS}!\x11`,
  /** Huruf 2x tinggi saja (lebar normal), cocok untuk TOTAL. */
  tallOn: `${GS}!\x01`,
  sizeNormal: `${GS}!\x00`,
} as const;

export type PaperSize = "58" | "80";

/** Jumlah karakter per baris (font standar): 58mm = 32, 80mm = 48. */
export function charsPerLine(paper: PaperSize): number {
  return paper === "80" ? 48 : 32;
}

/**
 * Ganti karakter yang tidak ada di printer (emoji, tanda kutip miring, dll)
 * supaya tidak tercetak sebagai "?" acak.
 */
export function sanitize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // é -> e
    .replace(/[‘’`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[\r\t]/g, " ")
    .replace(/[^\x20-\x7e\n]/g, ""); // sisanya (emoji dsb) dibuang
}

/** Garis pemisah selebar kertas. */
export function divider(width: number, char = "-"): string {
  return char.repeat(width);
}

/**
 * Pecah teks panjang jadi beberapa baris (tidak memotong di tengah kata kalau bisa).
 */
export function wrap(text: string, width: number): string[] {
  const result: string[] = [];
  for (const paragraph of sanitize(text).split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      let rest = word;
      while (rest.length > width) {
        // kata lebih panjang dari 1 baris -> potong paksa
        if (line) {
          result.push(line);
          line = "";
        }
        result.push(rest.slice(0, width));
        rest = rest.slice(width);
      }
      if (!rest) continue;
      if (!line) line = rest;
      else if (line.length + 1 + rest.length <= width) line += ` ${rest}`;
      else {
        result.push(line);
        line = rest;
      }
    }
    result.push(line);
  }
  return result;
}

/**
 * Dua kolom dalam satu baris: kiri rata kiri, kanan rata kanan.
 * Kalau tidak muat, teks kiri dipecah dan teks kanan ditaruh di baris terakhir.
 *   row("Nasi Goreng", "Rp15.000", 32) -> "Nasi Goreng             Rp15.000"
 */
export function row(left: string, right: string, width: number): string[] {
  const r = sanitize(right);
  const maxLeft = Math.max(1, width - r.length - 1);
  const lines = wrap(left, maxLeft);
  const last = lines.pop() ?? "";
  const gap = Math.max(1, width - last.length - r.length);
  return [...lines, last + " ".repeat(gap) + r];
}

/** Teks di tengah (dengan spasi, untuk printer yang mengabaikan perintah align). */
export function center(text: string, width: number): string[] {
  return wrap(text, width).map((line) => {
    const pad = Math.max(0, Math.floor((width - line.length) / 2));
    return " ".repeat(pad) + line;
  });
}
