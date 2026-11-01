import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import type { DateRange } from "@/lib/period";
import { getSupabase } from "@/lib/supabase";
import type { Expense, OrderWithItems } from "@/types/database";

const PAGE = 1000; // Supabase membatasi 1000 baris per permintaan

/** Ambil semua baris (lebih dari 1000 pun) dengan meminta per halaman. */
async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

/**
 * Data mentah untuk Laporan & Dashboard: semua order (+ item) dan pengeluaran dalam rentang tanggal.
 * Hitungannya ada di buildReport() (src/lib/report.ts).
 */
export function useReportData(range: DateRange) {
  return useQuery({
    queryKey: [...queryKeys.report, range.from, range.to],
    queryFn: async () => {
      const supabase = getSupabase();
      const [orders, expenses] = await Promise.all([
        fetchAll<OrderWithItems>((from, to) =>
          supabase
            .from("orders")
            .select("*, order_items(*)")
            .gte("business_date", range.from)
            .lte("business_date", range.to)
            .order("created_at", { ascending: false })
            .order("id", { ascending: false }) // urutan tetap untuk pembagian halaman
            .range(from, to),
        ),
        fetchAll<Expense>((from, to) =>
          supabase
            .from("expenses")
            .select("*")
            .gte("expense_date", range.from)
            .lte("expense_date", range.to)
            .order("expense_date", { ascending: false })
            .order("id", { ascending: false }) // urutan tetap supaya pembagian halaman tidak menggandakan / melewatkan baris
            .range(from, to),
        ),
      ]);
      return { orders, expenses };
    },
  });
}
