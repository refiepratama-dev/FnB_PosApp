import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryClient";
import type { StoreSettings } from "@/types/database";

/**
 * CONTOH POLA AMBIL DATA (tiru pola ini untuk data lain).
 *
 *   const { data: settings, isLoading, error } = useStoreSettings();
 */
export function useStoreSettings() {
  return useQuery({
    queryKey: queryKeys.storeSettings,
    queryFn: async () => {
      const { data, error } = await getSupabase().from("store_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data as StoreSettings;
    },
  });
}

/**
 * CONTOH POLA SIMPAN DATA.
 *
 *   const update = useUpdateStoreSettings();
 *   update.mutate({ tax_enabled: true }, { onSuccess: () => ..., onError: (e) => ... });
 *   update.isPending  -> true saat sedang menyimpan (pakai untuk loading tombol)
 */
export function useUpdateStoreSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (changes: Partial<Omit<StoreSettings, "id" | "updated_at">>) => {
      const { error } = await getSupabase().from("store_settings").update(changes).eq("id", 1);
      if (error) throw error;
    },
    // Setelah berhasil, minta semua halaman yang memakai data ini untuk ambil ulang
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.storeSettings }),
  });
}
