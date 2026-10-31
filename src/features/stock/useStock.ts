import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { getSupabase } from "@/lib/supabase";
import type { StockMovement } from "@/types/database";

/**
 * Data stok. Daftar menu yang dihitung stoknya diambil dari useMenuItems() ("@/hooks/useMenu"),
 * yaitu menu dengan track_stock = true. Hook di sini untuk riwayat dan untuk MENGUBAH stok.
 * Stok TIDAK boleh diubah langsung: harus lewat fungsi database adjust_stock.
 */

export type StockMovementWithName = StockMovement & { menu_items: { name: string } | null };

/** Riwayat pergerakan stok, terbaru dulu. menuItemId = null -> semua menu. */
export function useStockMovements(menuItemId: string | null, limit: number, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.stock, "movements", menuItemId ?? "all", limit],
    enabled,
    queryFn: async () => {
      let query = getSupabase()
        .from("stock_movements")
        .select("*, menu_items(name)")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (menuItemId) query = query.eq("menu_item_id", menuItemId);
      const { data, error } = await query;
      if (error) throw error;
      return data as StockMovementWithName[];
    },
  });
}

/**
 * mode "add"    : tambah stok (barang datang), qty = jumlah yang ditambahkan
 * mode "adjust" : sesuaikan stok, qty = jumlah sebenarnya sekarang
 * Memakai mode "adjust" pada menu baru otomatis memasukkannya ke halaman Stok.
 */
export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { menuItemId: string; mode: "add" | "adjust"; qty: number; note: string }) => {
      const { error } = await getSupabase().rpc("adjust_stock", {
        p_menu_item_id: input.menuItemId,
        p_mode: input.mode,
        p_qty: input.qty,
        p_note: input.note.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu });
      queryClient.invalidateQueries({ queryKey: queryKeys.stock });
    },
  });
}

/** Keluarkan menu dari halaman Stok: menu kembali "selalu tersedia". */
export function useUntrackStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (menuItemId: string) => {
      const { error } = await getSupabase().from("menu_items").update({ track_stock: false }).eq("id", menuItemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu });
      queryClient.invalidateQueries({ queryKey: queryKeys.stock });
    },
  });
}
