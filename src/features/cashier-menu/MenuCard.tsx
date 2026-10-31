import { Image, Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import { formatRupiah } from "@/lib/format";
import type { MenuItem } from "@/types/database";

// Warna kotak inisial untuk menu tanpa foto
const TILE_COLORS = ["bg-brand-soft", "bg-action-soft", "bg-panel"];
const TEXT_COLORS = ["text-brand", "text-action", "text-ink-muted"];

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function colorIndex(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash + ch.charCodeAt(0)) % 997;
  return hash % TILE_COLORS.length;
}

/** Kartu menu di grid kasir: foto, nama, harga, badge jumlah di keranjang, label Habis / sisa stok. */
export function MenuCard({
  item,
  price,
  qtyInCart,
  onPress,
  onLongPress,
}: {
  item: MenuItem;
  price: number;
  qtyInCart: number;
  onPress: () => void;
  onLongPress?: () => void; // tahan lama = buka popup (untuk tambah catatan)
}) {
  const soldOut = item.track_stock && item.stock_qty <= 0;
  const c = colorIndex(item.name);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={soldOut}
      className={`flex-1 overflow-hidden rounded-3xl border bg-white active:opacity-80 ${
        qtyInCart > 0 ? "border-brand" : "border-line"
      } ${soldOut ? "opacity-50" : ""}`}
      style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 }}
    >
      <View className="aspect-square w-full">
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className={`h-full w-full items-center justify-center ${TILE_COLORS[c]}`}>
            <AppText variant="heading" className={`text-3xl ${TEXT_COLORS[c]}`}>
              {initials(item.name)}
            </AppText>
          </View>
        )}

        {qtyInCart > 0 ? (
          <View className="absolute right-2 top-2 h-8 min-w-8 items-center justify-center rounded-full bg-action px-2">
            <AppText variant="heading" className="text-sm text-white">
              {qtyInCart}
            </AppText>
          </View>
        ) : null}

        {soldOut ? (
          <View className="absolute inset-x-0 bottom-0 items-center bg-ink/70 py-1">
            <AppText variant="heading" className="text-xs text-white">
              HABIS
            </AppText>
          </View>
        ) : item.track_stock ? (
          <View className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5">
            <AppText className="text-[11px] text-ink-muted">Sisa {item.stock_qty}</AppText>
          </View>
        ) : null}
      </View>

      <View className="gap-0.5 p-3">
        <AppText numberOfLines={2} className="min-h-10 text-sm leading-5">
          {item.name}
        </AppText>
        <AppText variant="heading" className="text-sm">
          {formatRupiah(price)}
        </AppText>
      </View>
    </Pressable>
  );
}
