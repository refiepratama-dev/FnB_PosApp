import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { Printer } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { HeaderAction } from "@/components/HeaderAction";
import { PeriodFilter } from "@/components/PeriodFilter";
import { QueryState } from "@/components/QueryState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { PAYMENT_METHOD_LABEL } from "@/constants/labels";
import { useExpensesRealtime } from "@/features/expenses/useExpenses";
import { useCategories, useMenuItems } from "@/hooks/useMenu";
import { useReportData } from "@/hooks/useReportData";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { formatRupiah } from "@/lib/format";
import { periodRange, todayPeriod } from "@/lib/period";
import { buildMenuSales, buildReport, type OrderTypeKey } from "@/lib/report";
import type { PaymentMethod } from "@/types/database";
import { BarChart } from "./BarChart";
import { KpiCard } from "./KpiCard";
import { MenuSalesList } from "./MenuSalesList";
import { PrintReportModal } from "./PrintReportModal";
import { reportMeta, TYPE_LABEL } from "./reportExport";
import { ShareList } from "./ShareList";

/** "1,2 jt" untuk label singkat di grafik */
function shortRupiah(value: number) {
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (value >= 1_000) return `Rp${Math.round(value / 1_000)} rb`;
  return `Rp${value}`;
}

function Section({ title, children, style }: { title: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={style} className="rounded-2xl border border-line bg-white p-4">
      <AppText variant="heading" className="mb-3 text-base">
        {title}
      </AppText>
      {children}
    </View>
  );
}

/**
 * Laporan / Report (sama untuk Owner portrait & Kasir landscape).
 * Desain awal: Fahri. Data asli dari Supabase, hitungan di src/lib/report.ts.
 */
export default function ReportScreen() {
  useExpensesRealtime(); // pengeluaran baru dari device lain ikut mengubah total pengeluaran & laba
  const [period, setPeriod] = useState(todayPeriod());
  const [width, setWidth] = useState(0);
  const range = periodRange(period);
  const query = useReportData(range);
  const storeName = useStoreSettings().data?.name ?? "Toko";
  const [printOpen, setPrintOpen] = useState(false);

  const report = useMemo(
    () =>
      query.data
        ? buildReport(
            query.data.orders,
            query.data.expenses,
            period.type,
            range,
            query.data.expensesFromIncome,
            query.data.pettyCashBalance,
          )
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query.data, period.type, range.from, range.to],
  );

  // penjualan per menu + jumlah varian & topping (butuh daftar menu & kategori untuk pengelompokan)
  const menus = useMenuItems();
  const categories = useCategories();
  const menuSales = useMemo(
    () => (query.data && menus.data && categories.data ? buildMenuSales(query.data.orders, menus.data, categories.data) : null),
    [query.data, menus.data, categories.data],
  );

  const wide = width >= 860; // tablet landscape: 2 kolom
  const kpiCols = width >= 700 ? 3 : 2;
  const gap = 12;
  const kpiWidth = width ? (width - 32 - gap * (kpiCols - 1)) / kpiCols : undefined;
  const half = width ? (width - 32 - gap) / 2 : undefined;
  const isHourly = period.type === "today" || period.type === "date";

  return (
    <View className="flex-1 bg-panel" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScreenHeader
        title="Laporan"
        right={report ? <HeaderAction label="Cetak" icon={Printer} variant="outline" onPress={() => setPrintOpen(true)} /> : undefined}
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => {
          void query.refetch();
          void menus.refetch();
          void categories.refetch();
        }} />}
      >
        <View className="rounded-2xl border border-line bg-white p-4">
          <PeriodFilter value={period} onChange={setPeriod} />
        </View>

        {query.isLoading || query.error || !report ? (
          <View className="h-64">
            <QueryState query={query} />
          </View>
        ) : (
          <>
            {/* Urutan: hasil utama (Omzet, Laba) → biaya (HPP, Pengeluaran) → volume (Transaksi, Batal).
                Di HP 2 kolom jadi 3 baris berpasangan. */}
            <View className="flex-row flex-wrap" style={{ gap }}>
              <KpiCard style={{ width: kpiWidth }} label="Omzet" value={formatRupiah(report.omzet)} tone="highlight" />
              <KpiCard
                style={{ width: kpiWidth }}
                label="Laba Sederhana"
                value={formatRupiah(report.profit)}
                tone={report.profit >= 0 ? "good" : "bad"}
              />
              <KpiCard style={{ width: kpiWidth }} label="HPP" value={formatRupiah(report.hpp)}/>
              <KpiCard style={{ width: kpiWidth }} label="Total Pengeluaran" value={formatRupiah(report.expenses)} />
              <KpiCard style={{ width: kpiWidth }} label="Jumlah Order" value={String(report.transactions)} />
              <KpiCard
                style={{ width: kpiWidth }}
                label="Order Dibatalkan"
                value={String(report.cancelledCount)}
                tone={report.cancelledCount ? "bad" : "default"}
                hint={report.cancelledCount ? formatRupiah(report.cancelledValue) : undefined}
              />
            </View>

            <Section title="Kas Kecil">
              <View className="flex-row flex-wrap gap-3">
                <View className="min-w-[45%] flex-1">
                  <AppText variant="muted" className="text-xs">
                    Sisa saldo saat ini
                  </AppText>
                  <AppText variant="heading" className="mt-1 text-lg text-brand">
                    {formatRupiah(report.pettyCashBalance)}
                  </AppText>
                </View>
                <View className="min-w-[45%] flex-1">
                  <AppText variant="muted" className="text-xs">
                    Pengeluaran dari kas kecil · periode ini
                  </AppText>
                  <AppText variant="heading" className="mt-1 text-lg">
                    {formatRupiah(report.expensesFromPettyCash)}
                  </AppText>
                </View>
                <View className="min-w-[45%] flex-1">
                  <AppText variant="muted" className="text-xs">
                    Pengeluaran dari pemasukan · periode ini
                  </AppText>
                  <AppText variant="heading" className="mt-1 text-lg">
                    {formatRupiah(report.expensesFromIncome)}
                  </AppText>
                </View>
              </View>
              <AppText variant="muted" className="mt-3 text-[11px]">
                Saldo saat ini adalah posisi kas kecil terbaru; dua angka pengeluaran mengikuti periode laporan yang dipilih.
              </AppText>
            </Section>

            <View className={wide ? "flex-row" : ""} style={{ gap }}>
              <Section title={isHourly ? "Penjualan per Jam" : "Penjualan per Hari"} style={wide ? { width: half } : undefined}>
                <BarChart
                  data={report.sales}
                  format={formatRupiah}
                  unitLabel={(b) => (isHourly ? `Jam ${b.label}:00` : period.type === "week" ? b.label : `Tanggal ${b.label}`)}
                />
                <AppText variant="muted" className="mt-2 text-[11px]">
                  Skala tertinggi {shortRupiah(Math.max(0, ...report.sales.map((s) => s.value)))}
                </AppText>
              </Section>
              <Section title="Jam Ramai (jumlah order)" style={wide ? { width: half } : undefined}>
                <BarChart data={report.peakHours} format={(v) => `${v} order`} unitLabel={(b) => `Jam ${b.label}:00`} />
              </Section>
            </View>

            <View className={wide ? "flex-row" : ""} style={{ gap }}>
              <Section title="Menu Terlaris" style={wide ? { width: half } : undefined}>
                <ShareList
                  items={report.topMenus.map((m) => ({
                    key: m.name,
                    label: m.name,
                    amount: m.revenue,
                    caption: `${m.qty} porsi`,
                    percent: report.topMenus[0] ? (m.qty / report.topMenus[0].qty) * 100 : 0,
                  }))}
                />
              </Section>
              <View style={wide ? { width: half, gap } : { gap }}>
                <Section title="Metode Bayar">
                  <ShareList
                    items={report.payments.map((p) => ({
                      key: p.key,
                      label: PAYMENT_METHOD_LABEL[p.key as PaymentMethod] ?? p.key,
                      amount: p.amount,
                      caption: `${p.percent}% · ${p.count}x`,
                      percent: p.percent,
                    }))}
                  />
                </Section>
                <Section title="Tipe Pesanan">
                  <ShareList
                    items={report.orderTypes.map((t) => ({
                      key: t.key,
                      label: TYPE_LABEL[t.key as OrderTypeKey] ?? t.key,
                      amount: t.amount,
                      caption: `${t.percent}% · ${t.count}x`,
                      percent: t.percent,
                    }))}
                  />
                </Section>
              </View>
            </View>
            <Section title="Penjualan per Menu">
              {menuSales ? (
                <MenuSalesList groups={menuSales} />
              ) : (
                <AppText variant="muted" className="py-4 text-center text-sm">
                  {menus.error || categories.error ? "Daftar menu gagal dimuat. Tarik layar ke bawah untuk coba lagi." : "Memuat daftar menu..."}
                </AppText>
              )}
              <AppText variant="muted" className="mt-3 text-[11px]">
                Angka varian & topping = jumlah porsi yang dipesan dengan pilihan itu.
              </AppText>
            </Section>

            <AppText variant="muted" className="text-center text-[11px]">
              Metode bayar & tipe pesanan dihitung dari total yang dibayar (termasuk pajak & service). Laba hanya
              mengurangi pengeluaran yang dibiayai dari pemasukan, bukan kas kecil.
            </AppText>
          </>
        )}
      </ScrollView>

      {report && query.data && printOpen ? (
        <PrintReportModal
          visible
          onClose={() => setPrintOpen(false)}
          report={report}
          meta={reportMeta(storeName, period, range)}
          expenses={query.data.expenses}
          orders={query.data.orders}
        />
      ) : null}
    </View>
  );
}
