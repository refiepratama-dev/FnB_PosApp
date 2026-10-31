import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { History, Package, Plus } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { Chip } from "@/components/Chip";
import { EmptyState } from "@/components/EmptyState";
import { QueryState } from "@/components/QueryState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SearchInput } from "@/components/SearchInput";
import { GridList } from "@/components/GridList";
import { HeaderAction } from "@/components/HeaderAction";
import { MenuThumb } from "@/components/MenuThumb";
import { useMenuItems } from "@/hooks/useMenu";
import { formatRupiah } from "@/lib/format";
import type { MenuItem } from "@/types/database";
import { AddToStockModal } from "./AddToStockModal";
import { MovementRow } from "./MovementRow";
import { StockDetailModal } from "./StockDetailModal";
import { useStockMovements } from "./useStock";

function StockCard({ item, onPress }: { item: MenuItem; onPress: () => void }) {
  const soldOut = item.stock_qty === 0;
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-3xl border p-3 active:bg-panel ${
        soldOut ? "border-action/30 bg-action-soft" : "border-line bg-white"
      }`}
    >
      <MenuThumb name={item.name} imageUrl={item.image_url} size={64} />
      <View className="flex-1">
        <AppText variant="heading" numberOfLines={1} className="text-base">
          {item.name}
        </AppText>
        <AppText variant="muted" className="text-sm">
          {formatRupiah(item.price)}
        </AppText>
        {soldOut ? (
          <View className="mt-1 self-start rounded-full bg-action px-2.5 py-0.5">
            <AppText variant="heading" className="text-xs text-white">
              HABIS
            </AppText>
          </View>
        ) : null}
      </View>
      <View className="items-end">
        <AppText variant="heading" className={`text-3xl ${soldOut ? "text-action" : ""}`}>
          {item.stock_qty}
        </AppText>
        <AppText variant="muted" className="text-xs">
          stok
        </AppText>
      </View>
    </Pressable>
  );
}

/** Tab Riwayat: pergerakan stok semua menu. */
function HistoryList() {
  const history = useStockMovements(null, 100);

  if (history.isLoading || history.error) return <QueryState query={history} />;
  const rows = history.data ?? [];

  return (
    <GridList
      data={rows}
      keyExtractor={(m) => m.id}
      refreshing={history.isRefetching}
      onRefresh={() => history.refetch()}
      renderItem={(m) => (
        <View className="rounded-3xl border border-line bg-white px-4">
          <MovementRow movement={m} showName />
        </View>
      )}
      empty={<EmptyState icon={History} title="Belum ada riwayat stok" description="Perubahan stok akan tampil di sini." />}
    />
  );
}

/**
 * Stok (dipakai Kasir landscape & Owner portrait).
 * Hanya memantau menu satuan yang dihitung: tambah stok, sesuaikan, riwayat.
 * Penanggung jawab: Ridho (lihat docs/CODING-GUIDE.md)
 */
export default function StockScreen() {
  const menuQuery = useMenuItems();
  const [tab, setTab] = useState<"stock" | "history">("stock");
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const items = menuQuery.data ?? [];

  const tracked = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((m) => m.track_stock && (!q || m.name.toLowerCase().includes(q)))
      // yang habis tampil paling atas supaya cepat terlihat
      .sort((a, b) => Number(b.stock_qty === 0) - Number(a.stock_qty === 0) || a.name.localeCompare(b.name));
  }, [items, search]);

  const candidates = useMemo(() => items.filter((m) => !m.track_stock), [items]);
  const trackedCount = items.filter((m) => m.track_stock).length;
  const soldOutCount = items.filter((m) => m.track_stock && m.stock_qty === 0).length;
  const detailItem = items.find((m) => m.id === detailId && m.track_stock) ?? null;

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Stok" right={<HeaderAction label="Menu" icon={Plus} onPress={() => setAddOpen(true)} />} />

      <View className="gap-3 border-b border-line px-4 py-3">
        <View className="flex-row gap-2">
          <Chip label="Stok" active={tab === "stock"} onPress={() => setTab("stock")} />
          <Chip label="Riwayat" active={tab === "history"} onPress={() => setTab("history")} />
        </View>
        {tab === "stock" ? (
          <>
            <SearchInput value={search} onChangeText={setSearch} placeholder="Cari menu..." />
            {trackedCount > 0 ? (
              <AppText variant="muted" className="text-xs">
                {trackedCount} menu dihitung
                {soldOutCount > 0 ? ` · ${soldOutCount} habis` : ""}
              </AppText>
            ) : null}
          </>
        ) : null}
      </View>

      {tab === "history" ? (
        <HistoryList />
      ) : menuQuery.isLoading || menuQuery.error ? (
        <QueryState query={menuQuery} />
      ) : (
        <GridList
          data={tracked}
          keyExtractor={(m) => m.id}
          refreshing={menuQuery.isRefetching}
          onRefresh={() => menuQuery.refetch()}
          renderItem={(m) => <StockCard item={m} onPress={() => setDetailId(m.id)} />}
          empty={
            trackedCount === 0 ? (
              <EmptyState
                icon={Package}
                title="Belum ada menu yang dihitung stoknya"
                description="Tambahkan menu satuan seperti kue atau minuman botol. Menu racikan tidak perlu, selalu tersedia."
              >
                <HeaderAction label="Tambah Menu" icon={Plus} onPress={() => setAddOpen(true)} />
              </EmptyState>
            ) : (
              <EmptyState icon={Package} title="Menu tidak ditemukan" />
            )
          }
        />
      )}

      <StockDetailModal item={detailItem} onClose={() => setDetailId(null)} />
      <AddToStockModal visible={addOpen} candidates={candidates} onClose={() => setAddOpen(false)} />
    </View>
  );
}
