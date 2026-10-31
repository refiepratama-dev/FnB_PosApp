import { Modal, View } from "react-native";
import { Check } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { colors } from "@/constants/colors";
import { ORDER_TYPE_LABEL, OJOL_PROVIDER_LABEL, PAYMENT_METHOD_LABEL } from "@/constants/labels";
import { formatRupiah } from "@/lib/format";
import type { Order } from "@/types/database";

/** Layar Order Selesai: centang hijau di atas, ringkasan, satu tombol Order Baru. */
export function OrderDoneModal({ order, onNewOrder }: { order: Order; onNewOrder: () => void }) {
  const typeLabel =
    order.order_type === "ojol" && order.ojol_provider
      ? OJOL_PROVIDER_LABEL[order.ojol_provider]
      : ORDER_TYPE_LABEL[order.order_type];

  return (
    <Modal visible transparent animationType="fade" supportedOrientations={["portrait", "landscape"]} onRequestClose={onNewOrder}>
      <View className="flex-1 items-center justify-center bg-black/40 p-4">
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

          {/* TODO (tahap printer): status cetak struk */}
          <Button title="Order Baru" variant="action" className="w-full" onPress={onNewOrder} />
        </View>
      </View>
    </Modal>
  );
}
