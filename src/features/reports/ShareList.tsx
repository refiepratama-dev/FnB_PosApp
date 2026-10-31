import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { formatRupiah } from "@/lib/format";

export type ShareItem = { key: string; label: string; amount: number; caption: string; percent: number };

/** Daftar dengan bar persentase (metode bayar, tipe pesanan, menu terlaris). */
export function ShareList({ items, empty = "Belum ada data" }: { items: ShareItem[]; empty?: string }) {
  if (items.length === 0) {
    return (
      <AppText variant="muted" className="py-4 text-center text-sm">
        {empty}
      </AppText>
    );
  }
  return (
    <View className="gap-3">
      {items.map((item) => (
        <View key={item.key}>
          <View className="mb-1 flex-row items-baseline justify-between gap-2">
            <AppText numberOfLines={1} className="flex-1 text-sm">
              {item.label}
            </AppText>
            <AppText variant="muted" className="text-xs">
              {item.caption}
            </AppText>
            <AppText variant="heading" className="text-sm">
              {formatRupiah(item.amount)}
            </AppText>
          </View>
          <View className="h-2 w-full overflow-hidden rounded-full bg-panel">
            <View className="h-full rounded-full bg-brand" style={{ width: `${Math.max(2, item.percent)}%` }} />
          </View>
        </View>
      ))}
    </View>
  );
}
