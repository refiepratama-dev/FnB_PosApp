import { Redirect } from "expo-router";

// TODO (langkah berikutnya): cek apakah device sudah terhubung ke toko & sudah login,
// lalu arahkan ke mode terakhir (Owner/Kasir). Untuk sekarang langsung ke Layar Awal.
export default function Index() {
  return <Redirect href="/start" />;
}
