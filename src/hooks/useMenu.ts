import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryClient";
import type { Category, MenuItemWithOptions } from "@/types/database";

/** Kategori yang aktif (tidak diarsipkan), urut sesuai sort_order. */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("categories")
        .select("*")
        .eq("is_archived", false)
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });
}

/**
 * Semua menu aktif + grup varian/topping + pilihannya.
 * Dipakai halaman Menu kasir (Refie) & Kelola Produk (Ridho).
 */
export function useMenuItems() {
  return useQuery({
    queryKey: queryKeys.menu,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("menu_items")
        .select("*, option_groups(*, options(*))")
        .eq("is_archived", false)
        .order("sort_order")
        .order("name")
        .order("sort_order", { referencedTable: "option_groups" })
        .order("sort_order", { referencedTable: "option_groups.options" });
      if (error) throw error;
      return data as MenuItemWithOptions[];
    },
  });
}
