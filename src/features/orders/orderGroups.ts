import type { Order } from "@/types/database";

/**
 * Kelompokkan order per tanggal (business_date) untuk daftar Order.
 * Fungsi murni (tanpa React Native) supaya mudah dites.
 */

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export type OrderSection<T extends Order> = {
  date: string; // "2026-11-02"
  title: string; // "Hari ini · Senin, 2 Nov 2026"
  paidCount: number;
  omzet: number; // order lunas: subtotal - diskon (sama dengan kartu Omzet di atas)
  data: T[];
};

/** "2026-11-02" -> "Senin, 2 Nov 2026" (tanpa geser zona waktu). */
export function dateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return `${DAYS[day]}, ${d} ${MONTHS[m - 1]} ${y}`;
}

/**
 * today = tanggal hari ini "YYYY-MM-DD" (dikirim dari luar supaya bisa dites).
 * Urutan: tanggal terbaru di atas, order di dalam tanggal mengikuti urutan asal.
 */
export function groupOrdersByDate<T extends Order>(orders: T[], today: string): OrderSection<T>[] {
  const yesterday = shiftDate(today, -1);
  const map = new Map<string, T[]>();
  for (const order of orders) {
    const list = map.get(order.business_date);
    if (list) list.push(order);
    else map.set(order.business_date, [order]);
  }

  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([date, data]) => {
      const paid = data.filter((o) => o.status === "paid");
      const prefix = date === today ? "Hari ini · " : date === yesterday ? "Kemarin · " : "";
      return {
        date,
        title: prefix + dateLabel(date),
        paidCount: paid.length,
        omzet: paid.reduce((sum, o) => sum + o.subtotal - o.discount_amount, 0),
        data,
      };
    });
}

function shiftDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
