/**
 * Hitung laporan dari data order & pengeluaran (fungsi murni, ada unit test).
 * Aturan sesuai docs/05-BUSINESS-RULES-DATA.md bagian A "Laporan":
 * - Omzet = jumlah (subtotal - diskon) order LUNAS. Pajak & service tidak masuk omzet.
 * - Modal (HPP) = jumlah HPP x qty item terjual (item tanpa HPP = 0).
 * - Laba sederhana = omzet - HPP - pengeluaran.
 * - Order DIBATALKAN tidak dihitung, hanya ditampilkan jumlahnya.
 */
import type { Expense, OjolProvider, OrderType, OrderWithItems, PaymentMethod } from "@/types/database";
import type { PeriodType } from "./period";

export type Bar = { label: string; value: number };
export type Share = { key: string; amount: number; count: number; percent: number };

export type Report = {
  omzet: number;
  transactions: number;
  average: number;
  hpp: number;
  expenses: number;
  profit: number;
  collected: number; // uang yang benar-benar diterima (total termasuk pajak & service)
  cancelledCount: number;
  cancelledValue: number;
  sales: Bar[]; // per jam (harian) atau per hari (minggu/bulan)
  peakHours: Bar[]; // jumlah order per jam
  topMenus: { name: string; qty: number; revenue: number }[];
  payments: Share[];
  orderTypes: Share[];
};

const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/** Jam buka default untuk grafik per jam (diperlebar otomatis kalau ada order di luar jam ini). */
const DEFAULT_OPEN = 8;
const DEFAULT_CLOSE = 22;

/** "dine_in" / "takeaway" / provider ojol (gofood, grabfood, shopeefood) */
export type OrderTypeKey = Exclude<OrderType, "ojol"> | OjolProvider;

function orderTypeKey(o: Pick<OrderWithItems, "order_type" | "ojol_provider">): OrderTypeKey {
  return o.order_type === "ojol" ? (o.ojol_provider ?? "gofood") : o.order_type;
}

function hourOf(iso: string) {
  return new Date(iso).getHours();
}

function hourBars(values: Map<number, number>): Bar[] {
  const hours = [...values.keys()];
  const from = Math.min(DEFAULT_OPEN, ...hours);
  const to = Math.max(DEFAULT_CLOSE, ...hours);
  const bars: Bar[] = [];
  for (let h = from; h <= to; h++) bars.push({ label: String(h).padStart(2, "0"), value: values.get(h) ?? 0 });
  return bars;
}

function shares(map: Map<string, { amount: number; count: number }>, order: string[]): Share[] {
  const total = [...map.values()].reduce((s, v) => s + v.amount, 0);
  return order
    .filter((key) => map.has(key))
    .map((key) => {
      const v = map.get(key)!;
      return { key, amount: v.amount, count: v.count, percent: total ? Math.round((v.amount / total) * 1000) / 10 : 0 };
    })
    .sort((a, b) => b.amount - a.amount);
}

function addTo<K>(map: Map<K, { amount: number; count: number }>, key: K, amount: number) {
  const cur = map.get(key) ?? { amount: 0, count: 0 };
  map.set(key, { amount: cur.amount + amount, count: cur.count + 1 });
}

/**
 * range: tanggal awal-akhir (YYYY-MM-DD) dari periodRange()
 */
export function buildReport(
  orders: OrderWithItems[],
  expenses: Pick<Expense, "amount">[],
  periodType: PeriodType,
  range: { from: string; to: string },
): Report {
  const paid = orders.filter((o) => o.status === "paid");
  const cancelled = orders.filter((o) => o.status === "cancelled");

  const omzet = paid.reduce((s, o) => s + o.subtotal - o.discount_amount, 0);
  const collected = paid.reduce((s, o) => s + o.total, 0);
  const hpp = paid.reduce((s, o) => s + o.order_items.reduce((t, i) => t + (i.cost_price ?? 0) * i.qty, 0), 0);
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);

  // Grafik penjualan
  let sales: Bar[];
  if (periodType === "today" || periodType === "date") {
    const byHour = new Map<number, number>();
    for (const o of paid) byHour.set(hourOf(o.created_at), (byHour.get(hourOf(o.created_at)) ?? 0) + o.subtotal - o.discount_amount);
    sales = hourBars(byHour);
  } else {
    const byDate = new Map<string, number>();
    for (const o of paid) byDate.set(o.business_date, (byDate.get(o.business_date) ?? 0) + o.subtotal - o.discount_amount);
    sales = [];
    const [y, m, d] = range.from.split("-").map(Number);
    const start = new Date(y, m - 1, d);
    for (let i = 0; ; i++) {
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      if (iso > range.to) break;
      sales.push({ label: periodType === "week" ? DAY_NAMES[i] : String(day.getDate()), value: byDate.get(iso) ?? 0 });
    }
  }

  // Jam ramai (jumlah order)
  const countByHour = new Map<number, number>();
  for (const o of paid) countByHour.set(hourOf(o.created_at), (countByHour.get(hourOf(o.created_at)) ?? 0) + 1);

  // Menu terlaris
  const menus = new Map<string, { qty: number; revenue: number }>();
  for (const o of paid) {
    for (const i of o.order_items) {
      const cur = menus.get(i.name) ?? { qty: 0, revenue: 0 };
      menus.set(i.name, { qty: cur.qty + i.qty, revenue: cur.revenue + i.unit_price * i.qty });
    }
  }
  const topMenus = [...menus.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
    .slice(0, 5);

  // Metode bayar & tipe pesanan (berdasarkan uang yang diterima)
  const payMap = new Map<string, { amount: number; count: number }>();
  const typeMap = new Map<string, { amount: number; count: number }>();
  for (const o of paid) {
    addTo(payMap, o.payment_method, o.total);
    addTo(typeMap, orderTypeKey(o), o.total);
  }
  const PAY_ORDER: PaymentMethod[] = ["cash", "qris", "transfer", "debit", "ojol"];
  const TYPE_ORDER: OrderTypeKey[] = ["dine_in", "takeaway", "gofood", "grabfood", "shopeefood"];

  return {
    omzet,
    transactions: paid.length,
    average: paid.length ? Math.round(omzet / paid.length) : 0,
    hpp,
    expenses: expenseTotal,
    profit: omzet - hpp - expenseTotal,
    collected,
    cancelledCount: cancelled.length,
    cancelledValue: cancelled.reduce((s, o) => s + o.total, 0),
    sales,
    peakHours: hourBars(countByHour),
    topMenus,
    payments: shares(payMap, PAY_ORDER),
    orderTypes: shares(typeMap, TYPE_ORDER),
  };
}

/** Satu baris "penjualan per menu" di laporan cetak (struk & PDF). */
export type MenuSalesRow = { name: string; qty: number; revenue: number };
export type MenuSalesGroup = { category: string; qty: number; revenue: number; rows: MenuSalesRow[] };

/**
 * Semua menu, terjual maupun tidak, dikelompokkan per kategori (untuk laporan cetak).
 * - Menu aktif yang tidak terjual tetap tampil dengan 0 porsi.
 * - Menu yang terjual tapi sudah dihapus/diganti nama masuk grup "Menu dihapus".
 * - Urutan grup = urutan kategori, lalu "Tanpa kategori", lalu "Menu dihapus".
 *   Di dalam grup: paling laku dulu, sisanya urut nama.
 * - Penjualan = harga satuan x porsi (sama dengan "Menu Terlaris").
 */
export function buildMenuSales(
  orders: OrderWithItems[],
  menus: { id: string; name: string; category_id: string | null }[],
  categories: { id: string; name: string }[],
): MenuSalesGroup[] {
  const sold = new Map<string, MenuSalesRow>(); // key: menu id, atau "name:<nama>" kalau menu tidak ditemukan
  const menuById = new Map(menus.map((m) => [m.id, m]));
  const menuIdByName = new Map(menus.map((m) => [m.name.trim().toLowerCase(), m.id]));

  for (const o of orders) {
    if (o.status !== "paid") continue;
    for (const i of o.order_items) {
      const id = i.menu_item_id && menuById.has(i.menu_item_id) ? i.menu_item_id : menuIdByName.get(i.name.trim().toLowerCase());
      const key = id ?? `name:${i.name.trim()}`;
      const cur = sold.get(key) ?? { name: id ? menuById.get(id)!.name : i.name.trim(), qty: 0, revenue: 0 };
      sold.set(key, { ...cur, qty: cur.qty + i.qty, revenue: cur.revenue + i.unit_price * i.qty });
    }
  }

  const NO_CATEGORY = "Tanpa kategori";
  const DELETED = "Menu dihapus";
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const groups = new Map<string, MenuSalesRow[]>([...categories.map((c) => [c.name, []] as [string, MenuSalesRow[]]), [NO_CATEGORY, []], [DELETED, []]]);

  for (const m of menus) {
    const group = (m.category_id && categoryName.get(m.category_id)) || NO_CATEGORY;
    groups.get(group)!.push(sold.get(m.id) ?? { name: m.name, qty: 0, revenue: 0 });
  }
  for (const [key, row] of sold) if (key.startsWith("name:")) groups.get(DELETED)!.push(row);

  return [...groups.entries()]
    .filter(([, rows]) => rows.length > 0)
    .map(([category, rows]) => ({
      category,
      qty: rows.reduce((s, r) => s + r.qty, 0),
      revenue: rows.reduce((s, r) => s + r.revenue, 0),
      rows: [...rows].sort((a, b) => b.qty - a.qty || b.revenue - a.revenue || a.name.localeCompare(b.name, "id")),
    }));
}
