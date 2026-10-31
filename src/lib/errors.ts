/**
 * Ambil pesan error yang bisa dibaca kasir dari error Supabase / jaringan.
 * Pesan dari fungsi database (misal "Stok Air Mineral tidak cukup") sudah bahasa Indonesia.
 */
export function errorMessage(error: unknown): string {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);

  if (/network request failed|failed to fetch|fetch failed/i.test(message)) {
    return "Tidak ada koneksi internet";
  }
  if (/duplicate key.*phone/i.test(message)) return "Nomor HP sudah terdaftar";
  if (/members_phone_check/i.test(message)) return "Nomor HP harus diawali 08 atau 62, 10–14 digit";
  return message;
}
