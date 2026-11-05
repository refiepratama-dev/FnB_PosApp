import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { deleteImage, uploadImage } from "@/lib/images";
import type { DateRange } from "@/lib/period";
import { queryKeys } from "@/lib/queryClient";
import { getSupabase } from "@/lib/supabase";
import type { Expense } from "@/types/database";

/** Setelah pengeluaran berubah: daftar Pengeluaran DAN Laporan / Dashboard (laba) ikut diperbarui. */
function refreshAll(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
  queryClient.invalidateQueries({ queryKey: queryKeys.report });
  queryClient.invalidateQueries({ queryKey: queryKeys.pettyCash });
}

export type PettyCashSummary = {
  opening_balance: number;
  opening_date: string | null;
  spent_from_petty_cash: number;
  spent_from_income: number;
  remaining_balance: number;
};

/** Saldo kas kecil berjalan, dihitung di database dari saldo awal dan seluruh pengeluaran sejak tanggal mulai. */
export function usePettyCashSummary() {
  return useQuery({
    queryKey: queryKeys.pettyCash,
    queryFn: async () => {
      const { data, error } = await getSupabase().rpc("get_petty_cash_summary");
      if (error) throw error;
      const summary = data?.[0] as PettyCashSummary | undefined;
      if (!summary) throw new Error("Ringkasan kas kecil tidak tersedia.");
      return {
        ...summary,
        opening_balance: Number(summary.opening_balance),
        spent_from_petty_cash: Number(summary.spent_from_petty_cash),
        spent_from_income: Number(summary.spent_from_income),
        remaining_balance: Number(summary.remaining_balance),
      };
    },
  });
}

/** Atur kas yang tersedia mulai hari ini; saldo sisa otomatis berlanjut ke hari berikutnya. */
export function useSetPettyCashBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (balance: number) => {
      const { error } = await getSupabase().rpc("set_petty_cash_balance", { p_balance: balance });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pettyCash });
      queryClient.invalidateQueries({ queryKey: queryKeys.report });
    },
  });
}

/** Tambah kas kecil; saldo yang sempat memakai pemasukan dikembalikan terlebih dahulu. */
export function useAddPettyCash() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      const { error } = await getSupabase().rpc("add_petty_cash", { p_amount: amount });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pettyCash });
      queryClient.invalidateQueries({ queryKey: queryKeys.report });
    },
  });
}

/** Pengeluaran dalam satu periode (tanggal terbaru di atas). */
export function useExpenses(range: DateRange) {
  return useQuery({
    queryKey: [...queryKeys.expenses, range.from, range.to],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("expenses")
        .select("*")
        .gte("expense_date", range.from)
        .lte("expense_date", range.to)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
  });
}

export type SaveExpenseInput = {
  id?: string; // kosong = pengeluaran baru
  description: string;
  amount: number;
  method: "cash" | "transfer";
  /** null = tanpa foto. Alamat https = foto lama (tidak diubah). Alamat file lokal = foto baru, diupload saat simpan. */
  receiptUri: string | null;
  /** Foto nota yang tersimpan sebelumnya (untuk dibersihkan kalau diganti / dihapus). */
  previousUrl: string | null;
};

/** Hapus foto di Storage tanpa pernah menggagalkan proses utama. */
async function removeImageQuietly(url: string | null) {
  try {
    await deleteImage("expense-receipts", url);
  } catch {
    // foto yatim di Storage bukan masalah besar
  }
}

/**
 * Tambah atau ubah pengeluaran, termasuk upload foto nota.
 * Tanggal diisi otomatis oleh database saat pengeluaran dibuat (docs/03 bagian 12).
 */
export function useSaveExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveExpenseInput) => {
      let receiptUrl = input.previousUrl;
      let uploaded: string | null = null;

      if (input.receiptUri === null) {
        receiptUrl = null;
      } else if (!/^https?:\/\//.test(input.receiptUri)) {
        uploaded = await uploadImage("expense-receipts", input.receiptUri);
        receiptUrl = uploaded;
      }

      const values = {
        description: input.description,
        amount: input.amount,
        method: input.method,
        receipt_image_url: receiptUrl,
      };
      const supabase = getSupabase();
      const { error } = input.id
        ? await supabase.from("expenses").update(values).eq("id", input.id)
        : await supabase.from("expenses").insert(values);

      if (error) {
        await removeImageQuietly(uploaded); // jangan tinggalkan foto yatim kalau simpan gagal
        throw error;
      }
      if (input.previousUrl && input.previousUrl !== receiptUrl) await removeImageQuietly(input.previousUrl);
    },
    onSuccess: () => refreshAll(queryClient),
  });
}

/** Hapus permanen (docs/05 bagian D), foto nota ikut dihapus. */
export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expense: Pick<Expense, "id" | "receipt_image_url">) => {
      const { error } = await getSupabase().from("expenses").delete().eq("id", expense.id);
      if (error) throw error;
      await removeImageQuietly(expense.receipt_image_url);
    },
    onSuccess: () => refreshAll(queryClient),
  });
}

/**
 * Pengeluaran dari device lain otomatis ter-update di halaman ini, Laporan, dan Dashboard.
 * Butuh migration 20261102000000_realtime_expenses.sql; tanpa itu app tetap jalan
 * (data ter-update saat ditarik ulang / pindah halaman).
 */
export function useExpensesRealtime() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const supabase = getSupabase();
    // nama channel unik supaya beberapa halaman boleh memasangnya bersamaan
    const channel = supabase
      .channel(`expenses-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => refreshAll(queryClient))
      .on("postgres_changes", { event: "*", schema: "public", table: "store_settings" }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.pettyCash });
        queryClient.invalidateQueries({ queryKey: queryKeys.report });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "petty_cash_replenishments" }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.pettyCash });
        queryClient.invalidateQueries({ queryKey: queryKeys.report });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
