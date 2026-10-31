import { useMemo, useState } from "react";
import { FlatList, Pressable, View, useWindowDimensions } from "react-native";
import { ChevronLeft, ReceiptText } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { Chip } from "@/components/Chip";
import { EmptyState } from "@/components/EmptyState";
import { PeriodFilter } from "@/components/PeriodFilter";
import { QueryState } from "@/components/QueryState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SearchInput } from "@/components/SearchInput";
import { colors } from "@/constants/colors";
import { formatRupiah } from "@/lib/format";
import { periodRange, todayPeriod } from "@/lib/period";
import { CancelOrderModal } from "./CancelOrderModal";
import { OrderDetail } from "./OrderDetail";
import { OrderRow } from "./OrderRow";
import { useOrders } from "./useOrders";

type StatusFilter = "all" | "paid" | "cancelled";

/**
 * Halaman Order: riwayat per periode, detail, batalkan.
 * Dipakai mode Kasir (landscape: daftar + detail berdampingan)
 * dan mode Owner (portrait: tap order -> halaman detail).
 * Penanggung jawab: Refie
 */
export default function OrdersScreen() {
  const { width } = useWindowDimensions();
  const [period, setPeriod] = useState(todayPeriod());
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const range = periodRange(period);
  const orders = useOrders(range);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (orders.data ?? []).filter(
      (o) =>
        (status === "all" || o.status === status) &&
        (!s ||
          o.order_number.toLowerCase().includes(s) ||
          (o.customer_name ?? "").toLowerCase().includes(s) ||
          (o.table_number ?? "").toLowerCase() === s),
    );
  }, [orders.data, status, search]);

  const paid = (orders.data ?? []).filter((o) => o.status === "paid");
  const omzet = paid.reduce((sum, o) => sum + o.subtotal - o.discount_amount, 0);
  const selected = orders.data?.find((o) => o.id === selectedId) ?? null;

  // Lebar layar cukup -> daftar & detail berdampingan (tablet landscape)
  const split = width >= 900;

  const cancelModal = cancelOpen && selected ? <CancelOrderModal order={selected} onClose={() => setCancelOpen(false)} /> : null;

  // HP / portrait: detail tampil sebagai halaman sendiri
  if (!split && selected) {
    return (
      <View className="flex-1 bg-white">
        <View className="h-16 flex-row items-center gap-2 border-b border-line px-3">
          <Pressable onPress={() => setSelectedId(null)} className="h-10 w-10 items-center justify-center rounded-full active:bg-panel">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <AppText variant="heading" className="text-lg">
            Detail Order
          </AppText>
        </View>
        <OrderDetail order={selected} onCancel={() => setCancelOpen(true)} />
        {cancelModal}
      </View>
    );
  }

  const list = (
    <View className="flex-1 bg-white">
      <View className="gap-3 border-b border-line px-5 py-4">
        <PeriodFilter
          value={period}
          onChange={(p) => {
            setPeriod(p);
            setSelectedId(null);
          }}
        />
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-panel px-4 py-3">
            <AppText variant="muted" className="text-xs">
              Order lunas
            </AppText>
            <AppText variant="heading" className="text-lg">
              {paid.length}
            </AppText>
          </View>
          <View className="flex-1 rounded-2xl bg-panel px-4 py-3">
            <AppText variant="muted" className="text-xs">
              Omzet
            </AppText>
            <AppText variant="heading" className="text-lg">
              {formatRupiah(omzet)}
            </AppText>
          </View>
        </View>
        <SearchInput value={search} onChangeText={setSearch} placeholder="Cari no. order / pelanggan / meja" />
        <View className="flex-row gap-2">
          <Chip label="Semua" active={status === "all"} onPress={() => setStatus("all")} />
          <Chip label="Lunas" active={status === "paid"} onPress={() => setStatus("paid")} />
          <Chip label="Dibatalkan" active={status === "cancelled"} onPress={() => setStatus("cancelled")} />
        </View>
      </View>

      {orders.isLoading || orders.error ? (
        <QueryState query={orders} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ReceiptText} title="Belum ada order" description="Order di periode ini akan muncul di sini" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <OrderRow order={item} selected={split && item.id === selectedId} onPress={() => setSelectedId(item.id)} />
          )}
        />
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Order" />
      {split ? (
        <View className="flex-1 flex-row">
          <View className="flex-1 border-r border-line">{list}</View>
          <View style={{ width: Math.min(460, width * 0.42) }} className="bg-white">
            {selected ? (
              <OrderDetail order={selected} onCancel={() => setCancelOpen(true)} />
            ) : (
              <EmptyState icon={ReceiptText} title="Pilih order" description="Tap order di daftar untuk melihat detailnya" />
            )}
          </View>
        </View>
      ) : (
        list
      )}
      {cancelModal}
    </View>
  );
}
