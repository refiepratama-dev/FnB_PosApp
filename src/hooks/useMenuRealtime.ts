import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { getSupabase } from "@/lib/supabase";

/**
 * Dengarkan perubahan menu dari device lain (realtime), lalu minta data menu diambil ulang.
 * Dipasang SEKALI di layout utama, jadi halaman lain tidak perlu memasang sendiri.
 * Butuh migration 20261101000000_realtime_menu.sql.
 */
export function useMenuRealtime(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const supabase = getSupabase();

    const refreshMenu = () => queryClient.invalidateQueries({ queryKey: queryKeys.menu });
    const refreshCategories = () => queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    const refreshStock = () => queryClient.invalidateQueries({ queryKey: queryKeys.stock });

    const channel = supabase
      .channel("menu-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => {
        refreshMenu();
        refreshStock();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "option_groups" }, refreshMenu)
      .on("postgres_changes", { event: "*", schema: "public", table: "options" }, refreshMenu)
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, refreshCategories)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);
}
