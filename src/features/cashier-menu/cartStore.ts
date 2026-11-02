import { create } from "zustand";
import { itemUnitPrice, ojolUnitPrice, type SelectedOption } from "@/lib/pricing";
import type { MenuItem, OjolProvider, OrderType, StoreSettings } from "@/types/database";

export type CartLine = {
  key: string; // item + pilihan + catatan yang sama digabung jadi 1 baris
  menuItemId: string;
  name: string;
  basePrice: number; // harga dasar menu (harga normal)
  options: SelectedOption[];
  note: string;
  qty: number;
  trackStock: boolean;
  stockQty: number;
};

type CartState = {
  lines: CartLine[];
  orderType: OrderType;
  ojolProvider: OjolProvider;
  ojolRef: string;
  tableNumber: string;
  customerName: string;
  member: { id: string; name: string } | null;
  discountPercent: number;

  addItem: (item: MenuItem, options?: SelectedOption[], note?: string, qty?: number) => boolean;
  changeQty: (key: string, delta: number) => void;
  removeLine: (key: string) => void;
  setOrderType: (type: OrderType) => void;
  setField: (field: "ojolRef" | "tableNumber" | "customerName", value: string) => void;
  setOjolProvider: (provider: OjolProvider) => void;
  setMember: (member: { id: string; name: string } | null) => void;
  setDiscount: (percent: number) => void;
  reset: () => void;
};

const initial = {
  lines: [] as CartLine[],
  orderType: "takeaway" as OrderType,
  ojolProvider: "gofood" as OjolProvider,
  ojolRef: "",
  tableNumber: "",
  customerName: "",
  member: null,
  discountPercent: 0,
};

function lineKey(menuItemId: string, options: SelectedOption[], note: string) {
  return `${menuItemId}|${options.map((o) => `${o.group}:${o.name}`).join(",")}|${note.trim()}`;
}

/** Jumlah porsi menu tertentu di keranjang (semua baris). */
export function qtyInCart(lines: CartLine[], menuItemId: string) {
  return lines.filter((l) => l.menuItemId === menuItemId).reduce((sum, l) => sum + l.qty, 0);
}

/** Harga 1 porsi sesuai tipe order (normal / ojol). */
export function lineUnitPrice(
  line: Pick<CartLine, "basePrice" | "options">,
  orderType: OrderType,
  provider: OjolProvider,
  settings: StoreSettings | undefined,
) {
  const normal = itemUnitPrice(line.basePrice, line.options);
  if (orderType !== "ojol") return normal;
  return ojolUnitPrice(normal, settings?.ojol_markup?.[provider] ?? 0);
}

/** Keranjang & isian order di halaman kasir. */
export const useCart = create<CartState>((set, get) => ({
  ...initial,

  // Mengembalikan false kalau stok tidak cukup
  addItem: (item, options = [], note = "", qty = 1) => {
    const lines = get().lines;
    if (item.track_stock && qtyInCart(lines, item.id) + qty > item.stock_qty) return false;

    const key = lineKey(item.id, options, note);
    const existing = lines.find((l) => l.key === key);
    if (existing) {
      set({ lines: lines.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l)) });
    } else {
      set({
        lines: [
          ...lines,
          {
            key,
            menuItemId: item.id,
            name: item.name,
            basePrice: item.price,
            options,
            note: note.trim(),
            qty,
            trackStock: item.track_stock,
            stockQty: item.stock_qty,
          },
        ],
      });
    }
    return true;
  },

  changeQty: (key, delta) => {
    const lines = get().lines;
    const line = lines.find((l) => l.key === key);
    if (!line) return;
    if (delta > 0 && line.trackStock && qtyInCart(lines, line.menuItemId) + delta > line.stockQty) return;
    const qty = line.qty + delta;
    set({ lines: qty <= 0 ? lines.filter((l) => l.key !== key) : lines.map((l) => (l.key === key ? { ...l, qty } : l)) });
  },

  removeLine: (key) => set({ lines: get().lines.filter((l) => l.key !== key) }),
  setOrderType: (orderType) => set({ orderType }),
  setField: (field, value) => set({ [field]: value } as Partial<CartState>),
  setOjolProvider: (ojolProvider) => set({ ojolProvider }),
  // Pilih member -> nama pelanggan otomatis diganti nama member (walau sudah diketik).
  // Hapus member -> nama pelanggan ikut dikosongkan kalau masih nama member tadi.
  setMember: (member) =>
    set((state) => ({
      member,
      customerName: member
        ? member.name
        : state.member && state.customerName.trim() === state.member.name
          ? ""
          : state.customerName,
    })),
  setDiscount: (discountPercent) => set({ discountPercent: Math.min(100, Math.max(0, discountPercent)) }),
  reset: () => set({ ...initial, orderType: get().orderType }), // tipe order terakhir dipertahankan
}));
