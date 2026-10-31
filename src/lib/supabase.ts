import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

/**
 * Client Supabase dibuat SETELAH device terhubung ke toko (scan QR),
 * karena tiap toko punya project Supabase sendiri.
 *
 * Cara pakai di halaman mana pun (setelah login):
 *   const { data, error } = await getSupabase().from("menu_items").select("*");
 */
let client: SupabaseClient | null = null;

export function initSupabase(url: string, anonKey: string) {
  client = createClient(url, anonKey, {
    auth: {
      storage: AsyncStorage, // sesi login disimpan di device
      autoRefreshToken: true, // sesi diperpanjang otomatis
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}

export function getSupabase(): SupabaseClient {
  if (!client) throw new Error("Device belum terhubung ke toko");
  return client;
}

// Perpanjang sesi hanya saat app sedang dibuka (hemat baterai)
AppState.addEventListener("change", (state) => {
  if (!client) return;
  if (state === "active") client.auth.startAutoRefresh();
  else client.auth.stopAutoRefresh();
});
