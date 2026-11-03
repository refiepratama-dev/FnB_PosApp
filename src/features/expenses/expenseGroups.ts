import { dateLabel, shiftDate } from "@/features/orders/orderGroups";
import type { Expense } from "@/types/database";

/**
 * Kelompokkan pengeluaran per tanggal (expense_date), sama seperti daftar Order.
 * Fungsi murni (tanpa React Native) supaya mudah dites.
 */
export type ExpenseSection = {
  date: string; // "2026-11-02"
  title: string; // "Hari ini · Senin, 2 Nov 2026"
  total: number;
  data: Expense[];
};

/** today = tanggal hari ini "YYYY-MM-DD". Tanggal terbaru di atas, isi tanggal mengikuti urutan asal. */
export function groupExpensesByDate(expenses: Expense[], today: string): ExpenseSection[] {
  const yesterday = shiftDate(today, -1);
  const map = new Map<string, Expense[]>();
  for (const expense of expenses) {
    const list = map.get(expense.expense_date);
    if (list) list.push(expense);
    else map.set(expense.expense_date, [expense]);
  }

  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([date, data]) => {
      const prefix = date === today ? "Hari ini · " : date === yesterday ? "Kemarin · " : "";
      return {
        date,
        title: prefix + dateLabel(date),
        total: data.reduce((sum, e) => sum + e.amount, 0),
        data,
      };
    });
}
