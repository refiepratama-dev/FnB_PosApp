/**
 * Bantuan input nominal pengeluaran (fungsi murni, ada unit test di __tests__).
 * Kolom `amount` di database bertipe int, jadi dibatasi supaya tidak meluap.
 */
export const MAX_EXPENSE = 2_000_000_000;

/** Sisakan angka saja, buang nol di depan. "0015.000" -> "15000" */
export function digitsOnly(text: string): string {
  return text.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

/** "15000" -> "15.000" (tampilan di kolom input) */
export function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** "15.000" -> 15000. Kosong / tidak valid -> null. */
export function parseAmount(text: string): number | null {
  const digits = digitsOnly(text);
  if (!digits) return null;
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : null;
}

/** Pesan error untuk nominal, atau null kalau valid (docs/05: nominal harus lebih dari 0). */
export function amountError(text: string): string | null {
  const value = parseAmount(text);
  if (value === null || value <= 0) return "Nominal harus lebih dari 0";
  if (value > MAX_EXPENSE) return "Nominal terlalu besar";
  return null;
}
