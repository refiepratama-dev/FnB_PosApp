/**
 * Bantuan input jumlah stok (fungsi murni, ada unit test di __tests__).
 */
export const MAX_STOCK = 999_999;

/** "12" -> 12. Kosong / bukan angka -> null. */
export function parseQty(text: string): number | null {
  const digits = text.replace(/\D/g, "");
  if (!digits) return null;
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : null;
}

/** Cek jumlah yang diketik. Mengembalikan pesan error atau null kalau aman. */
export function qtyError(qty: number | null, mode: "add" | "adjust"): string | null {
  if (qty === null) return "Isi jumlah dulu";
  if (qty > MAX_STOCK) return "Jumlah terlalu besar";
  if (mode === "add" && qty <= 0) return "Jumlah yang ditambahkan harus lebih dari 0";
  return null;
}

/** Stok setelah aksi, untuk pratinjau sebelum disimpan. */
export function stockAfter(current: number, qty: number, mode: "add" | "adjust"): number {
  return mode === "add" ? current + qty : qty;
}

export const MOVEMENT_LABEL = {
  add: "Tambah stok",
  adjust: "Penyesuaian",
  sale: "Terjual",
  cancel: "Order dibatalkan",
} as const;
