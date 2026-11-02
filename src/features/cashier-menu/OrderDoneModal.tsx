import { ActivityIndicator, Modal, Pressable, View } from "react-native";
import { Check, CircleAlert, Printer } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { colors } from "@/constants/colors";
import { ORDER_TYPE_LABEL, OJOL_PROVIDER_LABEL, PAYMENT_METHOD_LABEL } from "@/constants/labels";
import { formatRupiah } from "@/lib/format";
import type { PrintStatus } from "@/hooks/usePrintReceipt";
import type { Order } from "@/types/database";

/** Baris status cetak struk di bawah ringkasan. */
function PrintStatusRow({ status, error, onPrint }: { status: PrintStatus; error: string; onPrint: () => void }) {
  if (status === "printing") {
    return (
      <View className="mb-4 h-10 flex-row items-center justify-center gap-2">
        <ActivityIndicator color={colors.brand} />
        <AppText variant="muted">Mencetak struk...</AppText>
      </View>
    );
  }
  if (status === "done") {
    return (
      <View className="mb-4 h-10 flex-row items-center justify-center gap-2">
        <Printer size={18} color={colors.success} />
        <AppText className="text-success">Struk tercetak</AppText>
        <Pressable onPress={onPrint} hitSlop={8} className="ml-2 p-1">
          <AppText className="text-sm text-brand">Cetak lagi</AppText>
        </Pressable>
      </View>
    );
  }
  return (
    <View className="mb-4 w-full items-center gap-2">
      {status === "failed" ? (
        <View className="w-full flex-row items-start gap-2 rounded-2xl bg-action-soft p-3">
          <CircleAlert size={18} color={colors.action} />
          <AppText className="flex-1 text-sm text-action">Struk gagal dicetak. {error}</AppText>
        </View>
      ) : status === "skipped" ? (
        <AppText variant="muted" className="text-center text-xs">
          Printer belum diatur. Pilih printer di Setting, Printer.
        </AppText>
      ) : null}
      <Button
        title={status === "failed" ? "Cetak Ulang" : "Cetak Struk"}
        variant="outline"
        className="w-full"
        onPress={onPrint}
      />
    </View>
  );
}

/** Layar Order Selesai: centang hijau di atas, ringkasan, status cetak struk, tombol Order Baru. */
export function OrderDoneModal({
  order,
  printStatus,
  printError,
  onPrint,
  onNewOrder,
}: {
  order: Order;
  printStatus: PrintStatus;
  printError: string;
  onPrint: () => void;
  onNewOrder: () => void;
}) {
  const insets = useSafeAreaInsets();
  const typeLabel =
    order.order_type === "ojol" && order.ojol_provider
      ? OJOL_PROVIDER_LABEL[order.ojol_provider]
      : ORDER_TYPE_LABEL[order.order_type];

  return (
    <Modal visible transparent animationType="none" supportedOrientations={["portrait", "landscape"]} onRequestClose={onNewOrder}>
      <View
        style={{ paddingTop: Math.max(16, insets.top), paddingBottom: Math.max(16, insets.bottom), paddingHorizontal: Math.max(16, insets.left, insets.right) }}
        className="flex-1 items-center justify-center bg-black/40"
      >
        <View className="w-full max-w-sm items-center rounded-3xl bg-white p-6">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-success">
            <Check size={44} color={colors.white} strokeWidth={3} />
          </View>
          <AppText variant="heading" className="text-2xl">
            Order Selesai
          </AppText>
          <AppText variant="heading" className="mt-3 text-3xl text-brand">
            {order.order_number}
          </AppText>
          <AppText variant="muted" className="mt-1 text-center">
            {typeLabel}
            {order.table_number ? ` • Meja ${order.table_number}` : ""}
            {order.customer_name ? ` • ${order.customer_name}` : ""}
          </AppText>

          <View className="my-5 w-full flex-row justify-between rounded-2xl bg-panel px-4 py-3">
            <AppText variant="muted">{PAYMENT_METHOD_LABEL[order.payment_method]}</AppText>
            <AppText variant="heading">{formatRupiah(order.total)}</AppText>
          </View>

          <PrintStatusRow status={printStatus} error={printError} onPrint={onPrint} />
          <Button title="Order Baru" variant="action" className="w-full" onPress={onNewOrder} />
        </View>
      </View>
    </Modal>
  );
}
