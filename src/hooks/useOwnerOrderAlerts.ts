import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { playCekring } from "@/lib/feedback";
import { queryKeys } from "@/lib/queryClient";
import { getSupabase } from "@/lib/supabase";

/**
 * Mode Owner: setiap ada order baru dari device mana pun, bunyi "cekring"
 * dan data Dashboard / Laporan / Order ikut ter-update. Dipasang di layout Owner.
 * (Saat app ditutup, bunyi lewat push notification menyusul di tahap 3.)
 */
export function useOwnerOrderAlerts(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const supabase = getSupabase();
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.report });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    };

    const channel = supabase
      .channel("owner-order-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, () => {
        playCekring();
        refresh();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, refresh) // order dibatalkan
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);
}
