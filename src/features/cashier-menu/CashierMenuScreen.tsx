import { useMemo, useState } from "react";
import { Alert, FlatList, ScrollView, View, useWindowDimensions } from "react-native";
import { UtensilsCrossed } from "lucide-react-native";
import { Chip } from "@/components/Chip";
import { EmptyState } from "@/components/EmptyState";
import { QueryState } from "@/components/QueryState";
import { SearchInput } from "@/components/SearchInput";
import { useCategories, useMenuItems } from "@/hooks/useMenu";
import { usePrintReceipt } from "@/hooks/usePrintReceipt";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { errorMessage } from "@/lib/errors";
import { playCekring, successFeedback, tapFeedback } from "@/lib/feedback";
import { calcOrderTotals, type SelectedOption } from "@/lib/pricing";
import type { MenuItemWithOptions, OjolCashSource, Order, PaymentMethod } from "@/types/database";
import { lineUnitPrice, qtyInCart, useCart, type CartLine } from "./cartStore";
import { DiscountModal } from "./DiscountModal";
import { MemberPickerModal } from "./MemberPickerModal";
import { MenuCard } from "./MenuCard";
import { OptionModal } from "./OptionModal";
import { OrderDoneModal } from "./OrderDoneModal";
import { OrderPanel } from "./OrderPanel";
import { PaymentModal } from "./PaymentModal";
import { useCreateOrder } from "./useCreateOrder";

const SIDEBAR_WIDTH = 192; // sama dengan w-48 di CashierSidebar (hanya untuk perkiraan awal)
const GRID_PADDING = 16;
const GRID_GAP = 12;
const MIN_CARD_WIDTH = 140;

/** Halaman Menu kasir: grid menu di kiri, panel pesanan di kanan. */
export default function CashierMenuScreen() {
  const { width } = useWindowDimensions();
  const menu = useMenuItems();
  const categories = useCategories();
  const { data: settings } = useStoreSettings();
  const createOrder = useCreateOrder();
  const cart = useCart();

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [optionItem, setOptionItem] = useState<MenuItemWithOptions | null>(null);
  const [modal, setModal] = useState<"member" | "discount" | "payment" | null>(null);
  const [doneOrder, setDoneOrder] = useState<Order | null>(null);
  const receipt = usePrintReceipt();
  const [measuredWidth, setMeasuredWidth] = useState(0);

  // Ukuran layout: lebar grid diukur langsung (onLayout), sebelum terukur pakai perkiraan
  const panelWidth = width >= 1100 ? 380 : 300;
  const gridWidth = measuredWidth || width - SIDEBAR_WIDTH - panelWidth;
  const columns = Math.max(2, Math.floor((gridWidth - GRID_PADDING * 2 + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP)));
  const cardWidth = (gridWidth - GRID_PADDING * 2 - GRID_GAP * (columns - 1)) / columns;

  // Harga sesuai tipe order (normal / ojol)
  const unitPriceOf = (line: Pick<CartLine, "basePrice" | "options">) =>
    lineUnitPrice(line, cart.orderType, cart.ojolProvider, settings);

  const totals = calcOrderTotals(
    cart.lines.map((l) => ({ unitPrice: unitPriceOf(l), qty: l.qty })),
    cart.discountPercent,
    settings ?? { tax_enabled: false, tax_percent: 0, service_enabled: false, service_percent: 0 },
  );

  const visibleItems = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (menu.data ?? []).filter(
      (item) => (!categoryId || item.category_id === categoryId) && (!s || item.name.toLowerCase().includes(s)),
    );
  }, [menu.data, categoryId, search]);

  function addToCart(item: MenuItemWithOptions, options: SelectedOption[] = [], note = "", qty = 1) {
    const ok = cart.addItem(item, options, note, qty);
    if (!ok) {
      Alert.alert("Stok tidak cukup", `Sisa stok ${item.name}: ${item.stock_qty}`);
      return;
    }
    tapFeedback();
  }

  function onTapItem(item: MenuItemWithOptions) {
    if (item.option_groups.length) setOptionItem(item);
    else addToCart(item);
  }

  function pay(method: PaymentMethod, ojolCashSource?: OjolCashSource) {
    createOrder.mutate(
      { paymentMethod: method, ojolCashSource, settings },
      {
        onSuccess: (order) => {
          playCekring();
          successFeedback();
          setModal(null);
          setDoneOrder(order);
          receipt.print(order, undefined, { auto: true }); // cetak otomatis (diam kalau printer belum diatur)
        },
        onError: (e) => Alert.alert("Order gagal disimpan", errorMessage(e)),
      },
    );
  }

  if (menu.isLoading || menu.error) {
    return (
      <View className="flex-1 flex-row">
        <View className="flex-1">
          <QueryState query={menu} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 flex-row bg-panel">
      {/* Kiri: cari, kategori, grid menu */}
      <View className="flex-1" onLayout={(e) => setMeasuredWidth(e.nativeEvent.layout.width)}>
        <View className="gap-3 border-b border-line bg-white px-4 py-3">
          <SearchInput value={search} onChangeText={setSearch} placeholder="Cari menu..." />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            <Chip label="Semua" active={!categoryId} onPress={() => setCategoryId(null)} />
            {(categories.data ?? []).map((c) => (
              <Chip key={c.id} label={c.name} active={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
            ))}
          </ScrollView>
        </View>

        {visibleItems.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title={search ? "Menu tidak ditemukan" : "Belum ada menu"}
            description={search ? `Tidak ada menu dengan nama "${search}"` : "Tambahkan menu di Setting > Kelola Produk"}
          />
        ) : (
          <FlatList
            key={columns} // susun ulang saat jumlah kolom berubah
            data={visibleItems}
            numColumns={columns}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: GRID_PADDING, gap: GRID_GAP }}
            columnWrapperStyle={{ gap: GRID_GAP }}
            renderItem={({ item }) => (
              <View style={{ width: cardWidth }}>
                <MenuCard
                  item={item}
                  price={unitPriceOf({ basePrice: item.price, options: [] })}
                  qtyInCart={qtyInCart(cart.lines, item.id)}
                  onPress={() => onTapItem(item)}
                  onLongPress={() => setOptionItem(item)}
                />
              </View>
            )}
          />
        )}
      </View>

      {/* Kanan: panel pesanan */}
      <OrderPanel
        width={panelWidth}
        totals={totals}
        unitPriceOf={unitPriceOf}
        onPickMember={() => setModal("member")}
        onDiscount={() => setModal("discount")}
        onPay={() => setModal("payment")}
        taxLabel={`Pajak ${settings?.tax_percent ?? 0}%`}
        serviceLabel={`Service ${settings?.service_percent ?? 0}%`}
      />

      {/* Popup */}
      {optionItem ? (
        <OptionModal
          item={optionItem}
          maxQty={optionItem.track_stock ? optionItem.stock_qty - qtyInCart(cart.lines, optionItem.id) : Infinity}
          unitPriceOf={(options) => unitPriceOf({ basePrice: optionItem.price, options })}
          onClose={() => setOptionItem(null)}
          onAdd={(options, note, qty) => {
            addToCart(optionItem, options, note, qty);
            setOptionItem(null);
          }}
        />
      ) : null}

      {modal === "member" ? (
        <MemberPickerModal
          onClose={() => setModal(null)}
          onSelect={(m) => {
            cart.setMember(m);
            if (!cart.customerName) cart.setField("customerName", m.name);
            setModal(null);
          }}
        />
      ) : null}

      {modal === "discount" ? (
        <DiscountModal
          value={cart.discountPercent}
          onClose={() => setModal(null)}
          onSave={(p) => {
            cart.setDiscount(p);
            setModal(null);
          }}
        />
      ) : null}

      {modal === "payment" ? (
        <PaymentModal
          total={totals.total}
          isOjol={cart.orderType === "ojol"}
          provider={cart.ojolProvider}
          saving={createOrder.isPending}
          onClose={() => setModal(null)}
          onPay={pay}
        />
      ) : null}

      {doneOrder ? (
        <OrderDoneModal
          order={doneOrder}
          printStatus={receipt.status}
          printError={receipt.error}
          onPrint={() => receipt.print(doneOrder)}
          onNewOrder={() => {
            cart.reset();
            receipt.reset();
            setDoneOrder(null);
          }}
        />
      ) : null}
    </View>
  );
}
