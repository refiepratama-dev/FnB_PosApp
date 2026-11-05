import { useMemo, useState } from "react";
import { Pressable, SectionList, View, useWindowDimensions } from "react-native";
import { ChevronLeft, ChevronRight, Plus, Wallet } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { Chip } from "@/components/Chip";
import { EmptyState } from "@/components/EmptyState";
import { HeaderAction } from "@/components/HeaderAction";
import { PeriodFilter } from "@/components/PeriodFilter";
import { QueryState } from "@/components/QueryState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SearchInput } from "@/components/SearchInput";
import { colors } from "@/constants/colors";
import { formatRupiah, formatTime, toISODate } from "@/lib/format";
import { periodRange, todayPeriod } from "@/lib/period";
import type { Expense } from "@/types/database";
import { ExpenseDetail } from "./ExpenseDetail";
import { ExpenseFormModal } from "./ExpenseFormModal";
import { groupExpensesByDate } from "./expenseGroups";
import { PettyCashModal } from "./PettyCashModal";
import { useExpenses, useExpensesRealtime, usePettyCashSummary } from "./useExpenses";

type MethodFilter = "all" | Expense["method"];

const METHOD_LABEL: Record<Expense["method"], string> = { cash: "Tunai", transfer: "Transfer" };

/** Kartu ringkasan merah teks putih (pengeluaran = uang keluar). */
function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-action px-4 py-3">
      <AppText variant="muted" className="text-xs text-white opacity-80">
        {label}
      </AppText>
      <AppText variant="heading" numberOfLines={1} adjustsFontSizeToFit className="text-lg text-white">
        {value}
      </AppText>
    </View>
  );
}

/** Satu baris pengeluaran, polanya sama dengan baris di daftar Order. */
function ExpenseRow({ expense, selected, onPress }: { expense: Expense; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 border-b border-line px-5 py-3 ${selected ? "bg-brand-soft" : "bg-white active:bg-panel"}`}
    >
      <View className="w-12 items-center">
        <AppText variant="heading" className="text-sm">
          {formatTime(expense.created_at)}
        </AppText>
      </View>
      <View className="flex-1">
        <AppText variant="heading" numberOfLines={1} className="text-sm">
          {expense.description}
        </AppText>
        <AppText variant="muted" numberOfLines={1} className="text-xs">
          {METHOD_LABEL[expense.method]}
          {expense.receipt_image_url ? " • Ada foto nota" : ""}
        </AppText>
      </View>
      <AppText variant="heading" className="text-sm text-action">
        {formatRupiah(expense.amount)}
      </AppText>
      <ChevronRight size={16} color={colors.inkMuted} />
    </Pressable>
  );
}

/**
 * Pengeluaran (dipakai Kasir landscape & Owner portrait), polanya sama dengan halaman Order:
 * tablet landscape = daftar + detail berdampingan, HP = tap baris -> halaman detail.
 * Daftar per tanggal, cari, filter Tunai/Transfer, tambah / ubah / hapus, foto nota.
 * Data asli dari tabel `expenses` di Supabase; total pengeluaran ikut masuk ke Laporan & Dashboard.
 * Penanggung jawab: Fahri (lihat docs/CODING-GUIDE.md)
 */
export default function ExpensesScreen() {
  useExpensesRealtime();
  const { width } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [period, setPeriod] = useState(todayPeriod());
  const [method, setMethod] = useState<MethodFilter>("all");
  const [search, setSearch] = useState("");
  const range = periodRange(period);
  const query = useExpenses(range);
  const pettyCashQuery = usePettyCashSummary();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null); // null = pengeluaran baru
  const [pettyCashOpen, setPettyCashOpen] = useState(false);
  const [pettyCashAction, setPettyCashAction] = useState<"set" | "add">("set");

  const expenses = useMemo(() => query.data ?? [], [query.data]);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return expenses.filter((e) => (method === "all" || e.method === method) && (!s || e.description.toLowerCase().includes(s)));
  }, [expenses, method, search]);

  const sections = useMemo(() => groupExpensesByDate(filtered, toISODate(new Date())), [filtered]);
  const selected = expenses.find((e) => e.id === selectedId) ?? null;

  // Lebar layar cukup -> daftar & detail berdampingan (tablet landscape), sama dengan halaman Order
  const split = width >= 900;

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(expense: Expense) {
    setEditing(expense);
    setFormOpen(true);
  }

  const formModal = <ExpenseFormModal visible={formOpen} expense={editing} onClose={() => setFormOpen(false)} />;
  const detail = selected ? (
    <ExpenseDetail expense={selected} onEdit={() => openEdit(selected)} onDeleted={() => setSelectedId(null)} />
  ) : null;

  // HP / portrait: detail tampil sebagai halaman sendiri
  if (!split && selected) {
    return (
      <View className="flex-1 bg-white">
        <View className="h-16 flex-row items-center gap-2 border-b border-line px-3">
          <Pressable onPress={() => setSelectedId(null)} className="h-10 w-10 items-center justify-center rounded-full active:bg-panel">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <AppText variant="heading" className="text-lg">
            Detail Pengeluaran
          </AppText>
        </View>
        {detail}
        {formModal}
      </View>
    );
  }

  const list = (
    <View className="flex-1 bg-white">
      <View className="gap-3 border-b border-line px-5 py-4">
        <PeriodFilter
          value={period}
          onChange={(p) => {
            setPeriod(p);
            setSelectedId(null);
          }}
        />
        <View className="flex-row gap-3">
          <SummaryCard label="Jumlah Transaksi" value={String(expenses.length)} />
          <SummaryCard label="Total Pengeluaran" value={formatRupiah(total)} />
        </View>
        <View className="rounded-2xl border border-line bg-white p-4">
          {pettyCashQuery.isLoading || pettyCashQuery.error ? (
            <View className="min-h-28">
              <QueryState query={pettyCashQuery} />
            </View>
          ) : pettyCashQuery.data ? (
            <>
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <AppText variant="muted" className="text-xs">
                    Sisa Kas Kecil
                  </AppText>
                  <AppText variant="heading" className="mt-1 text-xl text-brand">
                    {formatRupiah(pettyCashQuery.data.remaining_balance)}
                  </AppText>
                </View>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => {
                      setPettyCashAction("set");
                      setPettyCashOpen(true);
                    }}
                    className="rounded-full border border-brand px-3 py-2 active:bg-brand-soft"
                  >
                    <AppText variant="heading" className="text-sm text-brand">
                      Atur Saldo
                    </AppText>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setPettyCashAction("add");
                      setPettyCashOpen(true);
                    }}
                    className="rounded-full bg-brand px-3 py-2 active:opacity-80"
                  >
                    <AppText variant="heading" className="text-sm text-white">
                      Tambah Kas
                    </AppText>
                  </Pressable>
                </View>
              </View>
              <AppText variant="muted" className="mt-2 text-xs">
                Dari kas kecil {formatRupiah(pettyCashQuery.data.spent_from_petty_cash)} · Dari pemasukan{" "}
                {formatRupiah(pettyCashQuery.data.spent_from_income)}
              </AppText>
              {pettyCashQuery.data.opening_date ? (
                <AppText variant="muted" className="mt-1 text-xs">
                  Saldo terbawa otomatis dari hari ke hari.
                </AppText>
              ) : (
                <AppText variant="muted" className="mt-1 text-xs">
                  Owner atau kasir dapat mengatur atau menambah saldo kas kecil.
                </AppText>
              )}
            </>
          ) : null}
        </View>
        <SearchInput value={search} onChangeText={setSearch} placeholder="Cari keterangan pengeluaran" />
        <View className="flex-row gap-2">
          <Chip label="Semua" active={method === "all"} onPress={() => setMethod("all")} />
          <Chip label="Tunai" active={method === "cash"} onPress={() => setMethod("cash")} />
          <Chip label="Transfer" active={method === "transfer"} onPress={() => setMethod("transfer")} />
        </View>
      </View>

      {query.isLoading || query.error ? (
        <QueryState query={query} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Wallet} title="Belum ada pengeluaran" description="Tidak ada catatan pengeluaran di periode ini.">
          <HeaderAction label="Tambah Pengeluaran" icon={Plus} onPress={openNew} />
        </EmptyState>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(e) => e.id}
          stickySectionHeadersEnabled
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          renderSectionHeader={({ section }) => (
            <View className="flex-row items-center justify-between gap-3 border-b border-line bg-panel px-5 py-2">
              <AppText variant="heading" numberOfLines={1} className="flex-1 text-sm">
                {section.title}
              </AppText>
              <AppText variant="muted" className="text-xs">
                {section.data.length} catatan · {formatRupiah(section.total)}
              </AppText>
            </View>
          )}
          renderItem={({ item }) => (
            <ExpenseRow expense={item} selected={split && item.id === selectedId} onPress={() => setSelectedId(item.id)} />
          )}
        />
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Pengeluaran" right={<HeaderAction label="Tambah" icon={Plus} onPress={openNew} />} />
      {split ? (
        <View className="flex-1 flex-row">
          <View className="flex-1 border-r border-line">{list}</View>
          <View style={{ width: Math.min(460, width * 0.42) }} className="bg-white">
            {detail ?? <EmptyState icon={Wallet} title="Pilih pengeluaran" description="Tap pengeluaran di daftar untuk melihat detailnya" />}
          </View>
        </View>
      ) : (
        list
      )}
      {formModal}
      {pettyCashQuery.data ? (
        <PettyCashModal
          visible={pettyCashOpen}
          balance={pettyCashQuery.data.remaining_balance}
          action={pettyCashAction}
          onClose={() => setPettyCashOpen(false)}
        />
      ) : null}
    </View>
  );
}
