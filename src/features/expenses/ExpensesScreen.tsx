import { useMemo, useState } from "react";
import { Image, Pressable, View } from "react-native";
import { ChevronRight, Plus, Wallet } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { EmptyState } from "@/components/EmptyState";
import { GridList } from "@/components/GridList";
import { HeaderAction } from "@/components/HeaderAction";
import { PeriodFilter } from "@/components/PeriodFilter";
import { QueryState } from "@/components/QueryState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors } from "@/constants/colors";
import { formatDate, formatRupiah, formatTime } from "@/lib/format";
import { periodRange, todayPeriod } from "@/lib/period";
import type { Expense } from "@/types/database";
import { ExpenseFormModal } from "./ExpenseFormModal";
import { useExpenses, useExpensesRealtime } from "./useExpenses";

const METHOD_LABEL: Record<Expense["method"], string> = { cash: "Tunai", transfer: "Transfer" };

function ExpenseCard({ expense, onPress }: { expense: Expense; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-3xl border border-line bg-white p-3 active:bg-panel"
    >
      {expense.receipt_image_url ? (
        <Image
          source={{ uri: expense.receipt_image_url }}
          style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: colors.panel }}
          resizeMode="cover"
        />
      ) : (
        <View className="h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-action-soft">
          <Wallet size={22} color={colors.action} />
        </View>
      )}
      <View className="flex-1">
        <AppText variant="heading" numberOfLines={2} className="text-base">
          {expense.description}
        </AppText>
        <AppText variant="muted" numberOfLines={1} className="text-xs">
          {formatDate(expense.expense_date + "T00:00:00")} · {formatTime(expense.created_at)} · {METHOD_LABEL[expense.method]}
        </AppText>
      </View>
      <AppText variant="heading" className="text-base text-action">
        {formatRupiah(expense.amount)}
      </AppText>
      <ChevronRight size={16} color={colors.inkMuted} />
    </Pressable>
  );
}

/**
 * Pengeluaran (dipakai Kasir landscape & Owner portrait): daftar per periode,
 * tambah / ubah / hapus, foto nota. Data asli dari tabel `expenses` di Supabase;
 * total pengeluaran ikut masuk ke Laporan & Dashboard (laba sederhana).
 * Penanggung jawab: Fahri (lihat docs/CODING-GUIDE.md)
 */
export default function ExpensesScreen() {
  useExpensesRealtime();
  const [period, setPeriod] = useState(todayPeriod());
  const range = periodRange(period);
  const query = useExpenses(range);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null); // null = pengeluaran baru

  const expenses = useMemo(() => query.data ?? [], [query.data]);
  const summary = useMemo(() => {
    let total = 0;
    let cash = 0;
    let transfer = 0;
    for (const e of expenses) {
      total += e.amount;
      if (e.method === "cash") cash += e.amount;
      else transfer += e.amount;
    }
    return { total, cash, transfer };
  }, [expenses]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(expense: Expense) {
    setEditing(expense);
    setFormOpen(true);
  }

  const header = (
    <View className="mb-1.5 gap-3 px-1.5 pb-1.5">
      <PeriodFilter value={period} onChange={setPeriod} />
      {query.data ? (
        <View className="rounded-3xl border border-line bg-white p-4">
          <AppText variant="muted" className="text-xs">
            Total Pengeluaran
          </AppText>
          <AppText variant="heading" numberOfLines={1} adjustsFontSizeToFit className="mt-1 text-2xl text-action">
            {formatRupiah(summary.total)}
          </AppText>
          <AppText variant="muted" numberOfLines={1} className="mt-0.5 text-xs">
            {expenses.length} catatan · Tunai {formatRupiah(summary.cash)} · Transfer {formatRupiah(summary.transfer)}
          </AppText>
        </View>
      ) : null}
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Pengeluaran" right={<HeaderAction label="Tambah" icon={Plus} onPress={openNew} />} />

      <GridList
        data={expenses}
        keyExtractor={(e) => e.id}
        refreshing={query.isRefetching}
        onRefresh={() => query.refetch()}
        header={header}
        renderItem={(e) => <ExpenseCard expense={e} onPress={() => openEdit(e)} />}
        empty={
          query.isLoading || query.error ? (
            <QueryState query={query} />
          ) : (
            <EmptyState icon={Wallet} title="Belum ada pengeluaran" description="Tidak ada catatan pengeluaran di periode ini.">
              <HeaderAction label="Tambah Pengeluaran" icon={Plus} onPress={openNew} />
            </EmptyState>
          )
        }
      />

      <ExpenseFormModal visible={formOpen} expense={editing} onClose={() => setFormOpen(false)} />
    </View>
  );
}
