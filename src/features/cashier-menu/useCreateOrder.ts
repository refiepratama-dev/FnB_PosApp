import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryClient";
import { useSession } from "@/store/session";
import type { OjolCashSource, Order, PaymentMethod, StoreSettings } from "@/types/database";
import { lineUnitPrice, useCart } from "./cartStore";

type PayInput = {
  paymentMethod: PaymentMethod;
  ojolCashSource?: OjolCashSource;
  settings: StoreSettings | undefined;
};

/** Simpan order lewat fungsi database create_order (stok ikut berkurang otomatis). */
export function useCreateOrder() {
  const queryClient = useQueryClient();
  const mode = useSession((s) => s.mode);

  return useMutation({
    mutationFn: async ({ paymentMethod, ojolCashSource, settings }: PayInput) => {
      const cart = useCart.getState();
      const isOjol = cart.orderType === "ojol";

      const { data, error } = await getSupabase().rpc("create_order", {
        p_order: {
          order_type: cart.orderType,
          ojol_provider: isOjol ? cart.ojolProvider : null,
          ojol_order_ref: isOjol ? cart.ojolRef : null,
          ojol_cash_source: isOjol ? ojolCashSource : null,
          table_number: cart.orderType === "dine_in" ? cart.tableNumber : null,
          customer_name: cart.customerName,
          member_id: cart.member?.id ?? null,
          discount_percent: cart.discountPercent,
          payment_method: isOjol ? "ojol" : paymentMethod,
          created_by_mode: mode ?? "cashier",
        },
        p_items: cart.lines.map((line) => ({
          menu_item_id: line.menuItemId,
          qty: line.qty,
          unit_price: lineUnitPrice(line, cart.orderType, cart.ojolProvider, settings),
          note: line.note,
          options: line.options,
        })),
      });
      if (error) throw error;
      return data as Order;
    },
    onSettled: () => {
      // stok & daftar order berubah
      queryClient.invalidateQueries({ queryKey: queryKeys.menu });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.report });
    },
  });
}
