/**
 * Bantuan input persen untuk Setting (fungsi murni, ada unit test di __tests__).
 * Aturan (docs/05 bagian E): persen pajak / service / ojol harus 0-100.
 * Kolom di database numeric(5,2) -> maksimal 2 angka di belakang koma.
 */

/** Hanya sisakan angka, titik, dan koma (dipakai di onChangeText). */
export function sanitizePercentInput(text: string): string {
  return text.replace(/[^0-9.,]/g, "");
}

/** "10" -> 10, "7,5" -> 7.5. Kosong / di luar 0-100 / lebih dari 2 desimal -> null. */
export function parsePercent(text: string): number | null {
  const t = text.trim().replace(",", ".");
  if (!/^\d+(\.\d{0,2})?$/.test(t)) return null;
  const value = Number(t);
  return value >= 0 && value <= 100 ? value : null;
}

/** 7.5 -> "7,5" (tampilan di kolom input) */
export function percentText(value: number): string {
  return String(value).replace(".", ",");
}
