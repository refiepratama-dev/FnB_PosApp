/**
 * Nomor HP member (fungsi murni, ada unit test di __tests__).
 * Aturan (docs/05-BUSINESS-RULES-DATA.md bagian E): angka saja, diawali 08 atau 62,
 * total 10-14 digit, dan unik. Aturan yang sama dijaga oleh database.
 */

/** Rapikan ketikan: "+62 812-3456-7890" -> "6281234567890". */
export function normalizePhone(input: string): string {
  return input.replace(/\D/g, "");
}

export function isValidPhone(phone: string): boolean {
  return /^(08|62)[0-9]{8,12}$/.test(phone);
}

/** Pesan error untuk kolom nomor HP, atau null kalau valid. */
export function phoneError(input: string): string | null {
  const phone = normalizePhone(input);
  if (!phone) return "Nomor HP wajib diisi";
  if (!/^(08|62)/.test(phone)) return "Nomor HP harus diawali 08 atau 62";
  if (!isValidPhone(phone)) return "Nomor HP harus 10–14 digit";
  return null;
}
