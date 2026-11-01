import { useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { router, type Href } from "expo-router";
import { ChevronRight, Package, ReceiptText, Users, Wallet, type LucideIcon } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { QueryState } from "@/components/QueryState";
import { colors } from "@/constants/colors";
import { useReportData } from "@/hooks/useReportData";
import { formatDate, formatRupiah, formatTime } from "@/lib/format";
import { periodRange, todayPeriod } from "@/lib/period";
import { buildReport } from "@/lib/report";
import { orderTypeText } from "@/features/orders/orderLabels";
import { useExpensesRealtime } from "@/features/expenses/useExpenses";
import { KpiCard } from "@/features/reports/KpiCard";

const SHORTCUTS: { label: string; href: Href; icon: LucideIcon; tint: string; color: string }[] = [
  { label: "Stok", href: "/owner/stock", icon: Package, tint: "bg-brand-soft", color: colors.brand },
  { label: "Pengeluaran", href: "/owner/expenses", icon: Wallet, tint: "bg-action-soft", color: colors.action },
  { label: "Member", href: "/owner/members", icon: Users, tint: "bg-success/10", color: colors.success },
];

/**
 * Dashboard Owner: ringkasan hari ini, akses cepat, order terbaru (realtime + cekring).
 * Desain awal: Fahri. Realtime & cekring dipasang di layout Owner (useOwnerOrderAlerts).
 */
export default function DashboardScreen() {
  useExpensesRealtime(); // pengeluaran baru dari device lain ikut mengubah laba
  const range = periodRange(todayPeriod());
  const query = useReportData(range);

  const report = useMemo(
    () => (query.data ? buildReport(query.data.orders, query.data.expenses, "today", range) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query.data, range.from],
  );
  const recent = (query.data?.orders ?? []).slice(0, 8);

  return (
    <ScrollView
      className="flex-1 bg-panel"
      contentContainerStyle={{ padding: 16, gap: 20 }}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
    >
      {/* 1. Ringkasan hari ini */}
      <View>
        <AppText variant="heading" className="text-lg">
          Ringkasan Hari Ini
        </AppText>
        <AppText variant="muted" className="mb-3 text-xs">
          {formatDate(new Date())}
        </AppText>
        {query.isLoading || query.error || !report ? (
          <View className="h-40">
            <QueryState query={query} />
          </View>
        ) : (
          <View className="gap-3">
            <View className="flex-row gap-3">
              <KpiCard style={{ flex: 1 }} label="Omzet" value={formatRupiah(report.omzet)} tone="brand" />
              <KpiCard style={{ flex: 1 }} label="Jumlah Order" value={String(report.transactions)} />
            </View>
            <KpiCard
              label="Laba Sederhana"
              value={formatRupiah(report.profit)}
              tone={report.profit >= 0 ? "good" : "bad"}
              hint={`HPP ${formatRupiah(report.hpp)} · Pengeluaran ${formatRupiah(report.expenses)}`}
            />
          </View>
        )}
      </View>

      {/* 2. Akses cepat */}
      <View>
        <AppText variant="heading" className="mb-3 text-lg">
          Akses Cepat
        </AppText>
        <View className="flex-row rounded-3xl border border-line bg-white p-3">
          {SHORTCUTS.map(({ label, href, icon: Icon, tint, color }) => (
            <Pressable key={label} onPress={() => router.push(href)} className="flex-1 items-center gap-2 rounded-2xl py-2 active:bg-panel">
              <View className={`h-14 w-14 items-center justify-center rounded-full ${tint}`}>
                <Icon size={26} color={color} />
              </View>
              <AppText className="text-sm">{label}</AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 3. Order terbaru (otomatis ter-update saat ada order baru) */}
      <View>
        <View className="mb-3 flex-row items-center justify-between">
          <AppText variant="heading" className="text-lg">
            Order Terbaru
          </AppText>
          <Pressable onPress={() => router.push("/owner/orders")} hitSlop={8}>
            <AppText className="text-sm text-brand">Lihat semua</AppText>
          </Pressable>
        </View>
        {recent.length === 0 && !query.isLoading ? (
          <View className="items-center gap-2 rounded-3xl border border-line bg-white py-8">
            <ReceiptText size={26} color={colors.inkMuted} />
            <AppText variant="muted">Belum ada order hari ini</AppText>
          </View>
        ) : (
          <View className="overflow-hidden rounded-3xl border border-line bg-white">
            {recent.map((o, i) => {
              const cancelled = o.status === "cancelled";
              return (
                <Pressable
                  key={o.id}
                  onPress={() => router.push("/owner/orders")}
                  className={`flex-row items-center gap-3 px-4 py-3 active:bg-panel ${i > 0 ? "border-t border-line" : ""}`}
                >
                  <AppText variant="heading" className="w-12 text-sm">
                    {formatTime(o.created_at)}
                  </AppText>
                  <View className="flex-1">
                    <AppText variant="heading" className={`text-sm ${cancelled ? "text-ink-muted line-through" : ""}`}>
                      {o.order_number}
                    </AppText>
                    <AppText variant="muted" numberOfLines={1} className="text-xs">
                      {cancelled ? "Dibatalkan · " : ""}
                      {orderTypeText(o)}
                    </AppText>
                  </View>
                  <AppText variant="heading" className={`text-sm ${cancelled ? "text-ink-muted line-through" : ""}`}>
                    {formatRupiah(o.total)}
                  </AppText>
                  <ChevronRight size={16} color={colors.inkMuted} />
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
