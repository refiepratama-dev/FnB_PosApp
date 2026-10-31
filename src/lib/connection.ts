import AsyncStorage from "@react-native-async-storage/async-storage";

/** Data koneksi toko (isi QR toko). */
export type StoreConnection = {
  url: string; // https://xxxx.supabase.co
  anonKey: string;
};

const KEY = "temanpos.connection";

/**
 * Isi QR toko berupa JSON:
 *   {"app":"temanpos","url":"https://xxxx.supabase.co","key":"eyJ..."}
 * Mengembalikan null kalau bukan QR TemanPOS.
 */
export function parseStoreCode(raw: string): StoreConnection | null {
  try {
    const data = JSON.parse(raw.trim());
    if (data?.app !== "temanpos") return null;
    const url = String(data.url ?? "").replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
    const anonKey = String(data.key ?? "");
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || anonKey.length < 20) return null;
    return { url, anonKey };
  } catch {
    return null;
  }
}

/** Buat isi QR dari data koneksi (dipakai di Setting > QR toko). */
export function buildStoreCode(conn: StoreConnection) {
  return JSON.stringify({ app: "temanpos", url: conn.url, key: conn.anonKey });
}

/** Cek apakah project Supabase toko benar-benar bisa dihubungi. */
export async function testConnection(conn: StoreConnection): Promise<boolean> {
  try {
    const res = await fetch(`${conn.url}/auth/v1/settings`, { headers: { apikey: conn.anonKey } });
    return res.ok;
  } catch {
    return false;
  }
}

export async function loadConnection(): Promise<StoreConnection | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as StoreConnection) : null;
}

export async function saveConnection(conn: StoreConnection) {
  await AsyncStorage.setItem(KEY, JSON.stringify(conn));
}

export async function clearConnection() {
  await AsyncStorage.removeItem(KEY);
}

/** Koneksi toko development dari file .env (hanya muncul saat development). */
export function devConnection(): StoreConnection | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!__DEV__ || !url || !anonKey) return null;
  return { url: url.replace(/\/+$/, "").replace(/\/rest\/v1$/, ""), anonKey };
}
