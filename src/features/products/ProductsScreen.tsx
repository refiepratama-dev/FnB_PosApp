import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { ChevronRight, Plus, SlidersHorizontal, Tags, UtensilsCrossed } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { EmptyState } from "@/components/EmptyState";
import { QueryState } from "@/components/QueryState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SearchInput } from "@/components/SearchInput";
import { colors } from "@/constants/colors";
import { useCategories, useMenuItems } from "@/hooks/useMenu";
import { formatRupiah } from "@/lib/format";
import type { MenuItem, MenuItemWithOptions } from "@/types/database";
import { CategoryManagerModal } from "./CategoryManagerModal";
import { GridList } from "./GridList";
import { HeaderAction } from "./HeaderAction";
import { MenuThumb } from "./MenuThumb";
import { OptionsEditorModal } from "./OptionsEditorModal";
import { summarizeOptions } from "./optionDraft";
import { ProductFormModal } from "./ProductFormModal";

/** "all" = semua menu, "none" = tanpa kategori, selain itu id kategori */
type CategoryFilter = string;

/** Satu menu di daftar: foto, nama, harga, HPP, kategori, dan jalan pintas ke varian & topping. */
function ProductCard({
  item,
  categoryName,
  onPress,
  onOptionsPress,
}: {
  item: MenuItemWithOptions;
  categoryName: string;
  onPress: () => void;
  onOptionsPress: () => void;
}) {
  const optionsLabel = summarizeOptions(item.option_groups);
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-3xl border border-line bg-white p-3 active:bg-panel"
    >
      <MenuThumb name={item.name} imageUrl={item.image_url} size={72} />
      <View className="flex-1">
        <AppText variant="heading" numberOfLines={1} className="text-base">
          {item.name}
        </AppText>
        <AppText variant="heading" className="text-brand">
          {formatRupiah(item.price)}
        </AppText>
        <AppText variant="muted" numberOfLines={1} className="text-xs">
          {categoryName} · HPP {item.cost_price != null ? formatRupiah(item.cost_price) : "-"}
          {item.track_stock ? ` · Stok ${item.stock_qty}` : ""}
        </AppText>
        <Pressable
          onPress={onOptionsPress}
          hitSlop={6}
          className="mt-2 flex-row items-center gap-1.5 self-start rounded-full bg-brand-soft px-3 py-1.5 active:opacity-70"
        >
          <SlidersHorizontal size={13} color={colors.brand} />
          <AppText className="text-xs text-brand">{optionsLabel || "Atur varian & topping"}</AppText>
        </Pressable>
      </View>
      <ChevronRight size={18} color={colors.inkMuted} />
    </Pressable>
  );
}

/**
 * Kelola Produk (Owner): kategori, menu, foto, serta jalan masuk ke editor varian & topping.
 * Penanggung jawab: Ridho (lihat docs/CODING-GUIDE.md)
 */
export default function ProductsScreen() {
  const menuQuery = useMenuItems();
  const categoriesQuery = useCategories();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItemWithOptions | null>(null); // null = menu baru
  const [optionsTarget, setOptionsTarget] = useState<MenuItemWithOptions | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const items = menuQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const hasUncategorized = items.some((m) => !m.category_id || !categories.some((c) => c.id === m.category_id));

  // Kalau kategori yang sedang dipilih diarsipkan, kembali ke "Semua"
  useEffect(() => {
    if (filter === "all") return;
    if (filter === "none" ? !hasUncategorized : !categories.some((c) => c.id === filter)) setFilter("all");
  }, [filter, categories, hasUncategorized]);

  const categoryNameOf = (item: MenuItem) =>
    categories.find((c) => c.id === item.category_id)?.name ?? "Tanpa kategori";

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((m) => {
      if (q && !m.name.toLowerCase().includes(q)) return false;
      if (filter === "all") return true;
      if (filter === "none") return !m.category_id || !categories.some((c) => c.id === m.category_id);
      return m.category_id === filter;
    });
  }, [items, categories, search, filter]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(item: MenuItemWithOptions) {
    setEditing(item);
    setFormOpen(true);
  }

  function afterCreated(saved: MenuItem) {
    Alert.alert("Menu tersimpan", `Mau atur varian & topping untuk "${saved.name}" sekarang?`, [
      { text: "Nanti", style: "cancel" },
      { text: "Atur sekarang", onPress: () => setOptionsTarget({ ...saved, option_groups: [] }) },
    ]);
  }

  const loadFailure = menuQuery.error ? menuQuery : categoriesQuery.error ? categoriesQuery : null;
  if (menuQuery.isLoading || categoriesQuery.isLoading || loadFailure) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Kelola Produk" />
        <QueryState query={loadFailure ?? (menuQuery.isLoading ? menuQuery : categoriesQuery)} />
      </View>
    );
  }

  const emptyBecauseNoMenu = items.length === 0;

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Kelola Produk" right={<HeaderAction label="Menu" icon={Plus} onPress={openNew} />} />

      <View className="gap-3 border-b border-line px-4 py-3">
        <View className="flex-row items-center gap-2">
          <SearchInput value={search} onChangeText={setSearch} placeholder="Cari menu..." className="flex-1" />
          <HeaderAction label="Kategori" icon={Tags} variant="outline" onPress={() => setCategoriesOpen(true)} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          <Chip label={`Semua (${items.length})`} active={filter === "all"} onPress={() => setFilter("all")} />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              active={filter === c.id}
              onPress={() => setFilter(c.id)}
            />
          ))}
          {hasUncategorized ? (
            <Chip label="Tanpa kategori" active={filter === "none"} onPress={() => setFilter("none")} />
          ) : null}
        </ScrollView>
      </View>

      <GridList
        data={visibleItems}
        keyExtractor={(m) => m.id}
        refreshing={menuQuery.isRefetching}
        onRefresh={() => {
          menuQuery.refetch();
          categoriesQuery.refetch();
        }}
        renderItem={(item) => (
          <ProductCard
            item={item}
            categoryName={categoryNameOf(item)}
            onPress={() => openEdit(item)}
            onOptionsPress={() => setOptionsTarget(item)}
          />
        )}
        empty={
          emptyBecauseNoMenu ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="Belum ada menu"
              description="Mulai dengan membuat kategori, lalu tambahkan menu pertama."
            >
              <Button title="Tambah Menu" onPress={openNew} />
            </EmptyState>
          ) : (
            <EmptyState icon={UtensilsCrossed} title="Menu tidak ditemukan" description="Coba kata kunci atau kategori lain." />
          )
        }
      />

      <ProductFormModal
        visible={formOpen}
        item={editing}
        categories={categories}
        defaultCategoryId={filter !== "all" && filter !== "none" ? filter : null}
        onClose={() => setFormOpen(false)}
        onCreated={afterCreated}
      />
      <OptionsEditorModal menu={optionsTarget} onClose={() => setOptionsTarget(null)} />
      <CategoryManagerModal
        visible={categoriesOpen}
        categories={categories}
        items={items}
        onClose={() => setCategoriesOpen(false)}
      />
    </View>
  );
}
