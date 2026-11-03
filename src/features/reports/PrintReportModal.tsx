import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { ChevronRight, FileText, ReceiptText, type LucideIcon } from "lucide-react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { colors } from "@/constants/colors";
import { useCategories, useMenuItems } from "@/hooks/useMenu";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { errorMessage } from "@/lib/errors";
import { buildMenuSales, type Report } from "@/lib/report";
import type { Expense, OrderWithItems } from "@/types/database";
import { printReportReceipt, shareReportPdf } from "./exportReport";
import { reportFileName, type ReportMeta } from "./reportExport";

type Mode = "receipt" | "pdf";

function Option({
  icon: Icon,
  title,
  description,
  tint,
  color,
  loading,
  disabled,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tint: string;
  color: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center gap-4 rounded-2xl border border-line bg-white p-4 active:bg-panel ${disabled && !loading ? "opacity-50" : ""}`}
    >
      <View className={`h-12 w-12 items-center justify-center rounded-xl ${tint}`}>
        <Icon size={24} color={color} />
      </View>
      <View className="flex-1">
        <AppText variant="heading" className="text-base">
          {title}
        </AppText>
        <AppText variant="muted" className="text-xs">
          {description}
        </AppText>
      </View>
      {loading ? <ActivityIndicator color={colors.brand} /> : <ChevronRight size={18} color={colors.inkMuted} />}
    </Pressable>
  );
}

/** Popup pilihan cetak laporan periode yang sedang dipilih: struk printer atau PDF. */
export function PrintReportModal({
  visible,
  onClose,
  report,
  meta,
  expenses,
  orders,
}: {
  visible: boolean;
  onClose: () => void;
  report: Report;
  meta: ReportMeta;
  expenses: Expense[];
  orders: OrderWithItems[];
}) {
  const settings = useStoreSettings().data;
  const menus = useMenuItems();
  const categories = useCategories();
  const [busy, setBusy] = useState<Mode | null>(null);

  async function run(mode: Mode) {
    setBusy(mode);
    try {
      // daftar semua menu (terjual maupun tidak) diambil dari data menu terbaru
      const [menuList, categoryList] = await Promise.all([
        menus.data ?? menus.refetch().then((r) => r.data),
        categories.data ?? categories.refetch().then((r) => r.data),
      ]);
      if (!menuList || !categoryList) throw new Error("Daftar menu belum termuat. Cek koneksi internet.");
      const menuSales = buildMenuSales(orders, menuList, categoryList);
      if (mode === "receipt") {
        if (!settings) throw new Error("Pengaturan toko belum termuat. Cek koneksi internet.");
        await printReportReceipt(report, meta, settings, menuSales);
      } else {
        await shareReportPdf(report, meta, expenses, menuSales);
      }
      onClose();
    } catch (e) {
      Alert.alert(mode === "receipt" ? "Laporan gagal dicetak" : "PDF gagal dibuat", errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppModal visible={visible} title="Cetak Laporan" onClose={busy ? () => undefined : onClose}>
      <View className="mb-4 rounded-2xl bg-panel px-4 py-3">
        <AppText variant="muted" className="text-xs">
          Laporan {meta.kind.toLowerCase()}
        </AppText>
        <AppText variant="heading" className="text-base">
          {meta.periodText}
        </AppText>
      </View>
      <View className="gap-3">
        <Option
          icon={ReceiptText}
          title="Struk"
          description="Ringkasan + semua menu, ke printer thermal (Setting > Printer)"
          tint="bg-accent-soft"
          color={colors.accent}
          loading={busy === "receipt"}
          disabled={busy !== null}
          onPress={() => void run("receipt")}
        />
        <Option
          icon={FileText}
          title="PDF"
          description={`Simpan atau kirim lewat WhatsApp · ${reportFileName(meta)}`}
          tint="bg-brand-soft"
          color={colors.brand}
          loading={busy === "pdf"}
          disabled={busy !== null}
          onPress={() => void run("pdf")}
        />
      </View>
    </AppModal>
  );
}
