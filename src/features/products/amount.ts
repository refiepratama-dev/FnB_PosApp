/**
 * Bantuan input angka rupiah / jumlah (fungsi murni, ada unit test di __tests__).
 * Kolom harga di database bertipe int, jadi dibatasi supaya tidak meluap.
 */
export const MAX_AMOUNT = 99_999_999;

/** Sisakan angka saja. Dipakai di onChangeText supaya kolom harga hanya bisa diisi angka. */
export function digitsOnly(text: string): string {
  return text.replace(/\D/g, "");
}

/** "15000" -> 15000. Kosong / tidak valid -> null. */
export function parseAmount(text: string): number | null {
  const digits = digitsOnly(text);
  if (!digits) return null;
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : null;
}
