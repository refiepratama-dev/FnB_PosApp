import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  clearConnection,
  loadConnection,
  saveConnection,
  type StoreConnection,
} from "@/lib/connection";
import { getSupabase, initSupabase } from "@/lib/supabase";

export type Mode = "owner" | "cashier";

/**
 * - loading   : app baru dibuka, sedang cek data di device
 * - noStore   : device belum terhubung ke toko -> layar Hubungkan ke Toko
 * - signedOut : sudah terhubung, belum login -> layar Login
 * - signedIn  : siap dipakai
 */
type Status = "loading" | "noStore" | "signedOut" | "signedIn";

type SessionState = {
  status: Status;
  connection: StoreConnection | null;
  mode: Mode | null; // mode terakhir, disimpan di device
  storeName: string;

  init: () => Promise<void>;
  connect: (conn: StoreConnection) => Promise<void>;
  disconnect: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  setMode: (mode: Mode | null) => Promise<void>;
  loadStoreName: () => Promise<void>;
};

const MODE_KEY = "temanpos.mode";

/** Ubah pesan error Supabase jadi bahasa yang dimengerti kasir. */
function loginErrorMessage(message: string) {
  if (/invalid login credentials/i.test(message)) return "Email atau password salah";
  if (/network|fetch/i.test(message)) return "Tidak bisa terhubung. Cek koneksi internet.";
  if (/email not confirmed/i.test(message)) return "Akun belum dikonfirmasi. Hubungi tim TemanPOS.";
  return message;
}

export const useSession = create<SessionState>((set, get) => ({
  status: "loading",
  connection: null,
  mode: null,
  storeName: "",

  init: async () => {
    const connection = await loadConnection();
    if (!connection) {
      set({ status: "noStore", connection: null });
      return;
    }

    const supabase = initSupabase(connection.url, connection.anonKey);
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") set({ status: "signedOut", mode: null });
    });

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      set({ status: "signedOut", connection });
      return;
    }

    const mode = (await AsyncStorage.getItem(MODE_KEY)) as Mode | null;
    set({ status: "signedIn", connection, mode });
    get().loadStoreName();
  },

  connect: async (conn) => {
    await saveConnection(conn);
    await get().init();
  },

  disconnect: async () => {
    if (get().connection) await getSupabase().auth.signOut().catch(() => {});
    await clearConnection();
    await AsyncStorage.removeItem(MODE_KEY);
    set({ status: "noStore", connection: null, mode: null, storeName: "" });
  },

  signIn: async (email, password) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
    if (error) return loginErrorMessage(error.message);
    set({ status: "signedIn" });
    get().loadStoreName();
    return null;
  },

  signOut: async () => {
    await getSupabase().auth.signOut().catch(() => {});
    await AsyncStorage.removeItem(MODE_KEY);
    set({ status: "signedOut", mode: null });
  },

  setMode: async (mode) => {
    if (mode) await AsyncStorage.setItem(MODE_KEY, mode);
    else await AsyncStorage.removeItem(MODE_KEY);
    set({ mode });
  },

  loadStoreName: async () => {
    const { data } = await getSupabase().from("store_settings").select("name").eq("id", 1).maybeSingle();
    if (data?.name) set({ storeName: data.name });
  },
}));
