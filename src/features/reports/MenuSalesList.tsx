import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { formatRupiah } from "@/lib/format";
import type { MenuSalesGroup, OptionCount } from "@/lib/report";

/** "Regular 15 · Large 10" */
function countsText(counts: OptionCount[]) {
  return counts.map((c) => `${c.name} ${c.qty}`).join(" · ");
}

/**
 * Penjualan per menu (dikelompokkan per kategori) beserta jumlah varian & topping yang dipesan.
 * Hanya menu yang terjual yang ditampilkan; daftar lengkap (termasuk 0 porsi) ada di cetak struk / PDF.
 */
export function MenuSalesList({ groups }: { groups: MenuSalesGroup[] }) {
  const sold = groups
    .map((g) => ({ ...g, rows: g.rows.filter((r) => r.qty > 0) }))
    .filter((g) => g.rows.length > 0);

  if (sold.length === 0) {
    return (
      <AppText variant="muted" className="py-4 text-center text-sm">
        Belum ada menu terjual
      </AppText>
    );
  }

  return (
    <View className="gap-4">
      {sold.map((g) => (
        <View key={g.category}>
          <View className="flex-row items-center justify-between rounded-lg bg-brand-soft px-3 py-2">
            <AppText variant="heading" className="flex-1 text-sm text-brand">
              {g.category}
            </AppText>
            <AppText variant="muted" className="mr-3 text-xs">
              {g.qty} porsi
            </AppText>
            <AppText variant="heading" className="text-sm text-brand">
              {formatRupiah(g.revenue)}
            </AppText>
          </View>
          {g.rows.map((r) => (
            <View key={r.name} className="border-b border-line px-3 py-2">
              <View className="flex-row items-baseline justify-between gap-2">
                <AppText numberOfLines={2} className="flex-1 text-sm">
                  {r.name}
                </AppText>
                <AppText variant="muted" className="text-xs">
                  {r.qty} porsi
                </AppText>
                <AppText variant="heading" className="text-sm">
                  {formatRupiah(r.revenue)}
                </AppText>
              </View>
              {r.variants.length > 0 ? (
                <AppText variant="muted" className="mt-1 text-xs">
                  Varian: {countsText(r.variants)}
                </AppText>
              ) : null}
              {r.toppings.length > 0 ? (
                <AppText variant="muted" className="mt-0.5 text-xs">
                  Topping: {countsText(r.toppings)}
                </AppText>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
