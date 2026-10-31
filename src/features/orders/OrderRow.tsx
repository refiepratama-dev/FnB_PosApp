import { Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import { formatRupiah, formatTime } from "@/lib/format";
import type { OrderWithItems } from "@/types/database";
import { orderTypeText } from "./orderLabels";

/** Satu baris di daftar order. */
export function OrderRow({
  order,
  selected,
  onPress,
}: {
  order: OrderWithItems;
  selected: boolean;
  onPress: () => void;
}) {
  const cancelled = order.status === "cancelled";
  const itemCount = order.order_items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 border-b border-line px-5 py-3 ${selected ? "bg-brand-soft" : "bg-white active:bg-panel"}`}
    >
      <View className="w-12 items-center">
        <AppText variant="heading" className={`text-sm ${cancelled ? "text-ink-muted" : ""}`}>
          {formatTime(order.created_at)}
        </AppText>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <AppText variant="heading" className={`text-sm ${cancelled ? "text-ink-muted line-through" : ""}`}>
            {order.order_number}
          </AppText>
          {cancelled ? (
            <View className="rounded-full bg-action-soft px-2 py-0.5">
              <AppText className="text-[10px] font-heading text-action">BATAL</AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="muted" numberOfLines={1} className="text-xs">
          {orderTypeText(order)}
          {order.customer_name ? ` • ${order.customer_name}` : ""} • {itemCount} item
        </AppText>
      </View>
      <AppText variant="heading" className={`text-sm ${cancelled ? "text-ink-muted line-through" : ""}`}>
        {formatRupiah(order.total)}
      </AppText>
    </Pressable>
  );
}
