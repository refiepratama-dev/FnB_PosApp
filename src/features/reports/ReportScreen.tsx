import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { AppText } from "@/components/AppText";
import { PeriodFilter } from "@/components/PeriodFilter";
import { QueryState } from "@/components/QueryState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { OJOL_PROVIDER_LABEL, ORDER_TYPE_LABEL, PAYMENT_METHOD_LABEL } from "@/constants/labels";
import { useExpensesRealtime } from "@/features/expenses/useExpenses";
import { useReportData } from "@/hooks/useReportData";
import { formatRupiah } from "@/lib/format";
import { periodRange, todayPeriod } from "@/lib/period";
import { buildReport, type OrderTypeKey } from "@/lib/report";
import type { PaymentMethod } from "@/types/database";
import { BarChart } from "./BarChart";
import { KpiCard } from "./KpiCard";
import { ShareList } from "./ShareList";

const TYPE_LABEL: Record<OrderTypeKey, string> = {
  dine_in: ORDER_TYPE_LABEL.dine_in,
  takeaway: ORDER_TYPE_LABEL.takeaway,
  ...OJOL_PROVIDER_LABEL,
};

/** "1,2 jt" untuk label singkat di grafik */
function shortRupiah(value: number) {
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (value >= 1_000) return `Rp${Math.round(value / 1_000)} rb`;
  return `Rp${value}`;
}

function Section({ title, children, style }: { title: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={style} className="rounded-3xl border border-line bg-white p-4">
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

  const report = useMemo(
    () => (query.data ? buildReport(query.data.orders, query.data.expenses, period.type, range) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query.data, period.type, range.from, range.to],
  );

  const wide = width >= 860; // tablet landscape: 2 kolom
  const kpiCols = width >= 700 ? 3 : 2;
  const gap = 12;
  const kpiWidth = width ? (width - 32 - gap * (kpiCols - 1)) / kpiCols : undefined;
  const half = width ? (width - 32 - gap) / 2 : undefined;
  const isHourly = period.type === "today" || period.type === "date";

  return (
    <View className="flex-1 bg-panel" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScreenHeader title="Laporan" />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
      >
        <View className="rounded-3xl border border-line bg-white p-4">
          <PeriodFilter value={period} onChange={setPeriod} />
        </View>

        {query.isLoading || query.error || !report ? (
          <View className="h-64">
            <QueryState query={query} />
          </View>
        ) : (
          <>
            <View className="flex-row flex-wrap" style={{ gap }}>
              <KpiCard style={{ width: kpiWidth }} label="Omzet" value={formatRupiah(report.omzet)} tone="brand" hint="Tanpa pajak & service" />
              <KpiCard style={{ width: kpiWidth }} label="Jumlah Transaksi" value={String(report.transactions)} />
              <KpiCard style={{ width: kpiWidth }} label="Rata-rata / Transaksi" value={formatRupiah(report.average)} />
              <KpiCard
                style={{ width: kpiWidth }}
                label="Laba Sederhana"
                value={formatRupiah(report.profit)}
                tone={report.profit >= 0 ? "good" : "bad"}
                hint={`HPP ${formatRupiah(report.hpp)}`}
              />
              <KpiCard style={{ width: kpiWidth }} label="Total Pengeluaran" value={formatRupiah(report.expenses)} />
              <KpiCard
                style={{ width: kpiWidth }}
                label="Order Dibatalkan"
                value={String(report.cancelledCount)}
                tone={report.cancelledCount ? "bad" : "default"}
                hint={report.cancelledCount ? formatRupiah(report.cancelledValue) : undefined}
              />
            </View>

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
            <AppText variant="muted" className="text-center text-[11px]">
              Metode bayar & tipe pesanan dihitung dari total yang dibayar (termasuk pajak & service).
            </AppText>
          </>
        )}
      </ScrollView>
    </View>
  );
}
