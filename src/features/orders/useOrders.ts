import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryClient";
import type { DateRange } from "@/lib/period";
import type { Order, OrderWithItems } from "@/types/database";

/** Daftar order (lengkap dengan item) dalam rentang tanggal, terbaru di atas. */
export function useOrders(range: DateRange) {
  const queryClient = useQueryClient();

  // Realtime: order baru / dibatalkan dari device lain langsung muncul
  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel("orders-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: [...queryKeys.orders, range.from, range.to],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("orders")
        .select("*, order_items(*)")
        .gte("business_date", range.from)
        .lte("business_date", range.to)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OrderWithItems[];
    },
  });
}

/** Batalkan order lewat fungsi database (stok dikembalikan otomatis). */
export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const { data, error } = await getSupabase().rpc("cancel_order", { p_order_id: orderId, p_reason: reason });
      if (error) throw error;
      return data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.menu }); // stok berubah
      queryClient.invalidateQueries({ queryKey: queryKeys.report });
    },
  });
}
