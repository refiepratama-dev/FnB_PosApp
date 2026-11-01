import { useEffect } from "react";
import { Alert, ScrollView, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { OJOL_CASH_SOURCE_LABEL, PAYMENT_METHOD_LABEL } from "@/constants/labels";
import { usePrintReceipt } from "@/hooks/usePrintReceipt";
import { formatDateTime, formatRupiah } from "@/lib/format";
import type { OrderWithItems } from "@/types/database";
import { orderTypeText } from "./orderLabels";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 py-1">
      <AppText variant="muted" className="text-sm">
        {label}
      </AppText>
      <AppText className="flex-1 text-right text-sm">{value}</AppText>
    </View>
  );
}

function MoneyRow({ label, value, minus = false, bold = false }: { label: string; value: number; minus?: boolean; bold?: boolean }) {
  return (
    <View className="flex-row justify-between py-0.5">
      <AppText variant={bold ? "heading" : "muted"} className={bold ? "text-base" : "text-sm"}>
        {label}
      </AppText>
      <AppText variant={bold ? "heading" : "body"} className={`${bold ? "text-lg" : "text-sm"} ${minus ? "text-action" : ""}`}>
        {minus ? "-" : ""}
        {formatRupiah(value)}
      </AppText>
    </View>
  );
}

/** Isi detail order: info, item, rincian harga, tombol cetak ulang & batalkan. */
export function OrderDetail({ order, onCancel }: { order: OrderWithItems; onCancel: () => void }) {
  const cancelled = order.status === "cancelled";
  const receipt = usePrintReceipt();
  const { reset } = receipt;

  // pindah ke order lain -> status "Tercetak" dikosongkan lagi
  useEffect(() => reset(), [order.id, reset]);

  async function reprint() {
    const error = await receipt.print(order, order.order_items);
    if (error) Alert.alert("Struk gagal dicetak", error);
  }
  const payment =
    order.payment_method === "ojol" && order.ojol_cash_source
      ? OJOL_CASH_SOURCE_LABEL[order.ojol_cash_source]
      : PAYMENT_METHOD_LABEL[order.payment_method];

  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="p-5">
        <View className="mb-4 flex-row items-center justify-between">
          <AppText variant="heading" className="text-2xl text-brand">
            {order.order_number}
          </AppText>
          <View className={`rounded-full px-3 py-1 ${cancelled ? "bg-action-soft" : "bg-success/10"}`}>
            <AppText className={`font-heading text-xs ${cancelled ? "text-action" : "text-success"}`}>
              {cancelled ? "DIBATALKAN" : "LUNAS"}
            </AppText>
          </View>
        </View>

        <View className="mb-4 rounded-2xl bg-panel px-4 py-3">
          <InfoRow label="Waktu" value={formatDateTime(order.created_at)} />
          <InfoRow label="Tipe" value={orderTypeText(order)} />
          {order.ojol_order_ref ? <InfoRow label="No. order ojol" value={order.ojol_order_ref} /> : null}
          {order.customer_name ? <InfoRow label="Pelanggan" value={order.customer_name} /> : null}
          {order.member_name ? <InfoRow label="Member" value={order.member_name} /> : null}
          <InfoRow label="Pembayaran" value={payment} />
          <InfoRow label="Dibuat di" value={order.created_by_mode === "owner" ? "Mode Owner" : "Mode Kasir"} />
          {cancelled ? (
            <InfoRow
              label="Dibatalkan"
              value={`${order.cancelled_at ? formatDateTime(order.cancelled_at) : ""}${order.cancel_reason ? ` • ${order.cancel_reason}` : ""}`}
            />
          ) : null}
        </View>

        <AppText variant="heading" className="mb-1 text-base">
          Item
        </AppText>
        {order.order_items.map((item) => (
          <View key={item.id} className="flex-row gap-3 border-b border-line py-3">
            <AppText variant="heading" className="w-8 text-sm">
              {item.qty}x
            </AppText>
            <View className="flex-1">
              <AppText className="text-sm">{item.name}</AppText>
              {item.options?.length ? (
                <AppText variant="muted" className="text-xs">
                  {item.options.map((o) => o.name).join(", ")}
                </AppText>
              ) : null}
              {item.note ? (
                <AppText variant="muted" className="text-xs italic">
                  “{item.note}”
                </AppText>
              ) : null}
            </View>
            <AppText className="text-sm">{formatRupiah(item.line_total)}</AppText>
          </View>
        ))}

        <View className="mt-3 gap-1">
          <MoneyRow label="Subtotal" value={order.subtotal} />
          {order.discount_amount ? <MoneyRow label={`Diskon ${Number(order.discount_percent)}%`} value={order.discount_amount} minus /> : null}
          {order.service_amount ? <MoneyRow label="Service" value={order.service_amount} /> : null}
          {order.tax_amount ? <MoneyRow label="Pajak" value={order.tax_amount} /> : null}
          <View className="mt-1 border-t border-line pt-2">
            <MoneyRow label="Total" value={order.total} bold />
          </View>
        </View>
      </ScrollView>

      <View className="flex-row gap-3 border-t border-line p-4">
        <View className="flex-1">
          <Button
            title={receipt.status === "done" ? "Tercetak ✓" : "Cetak Ulang"}
            variant="outline"
            loading={receipt.status === "printing"}
            disabled={receipt.status === "printing"}
            onPress={reprint}
          />
        </View>
        {!cancelled ? (
          <View className="flex-1">
            <Button title="Batalkan Order" variant="action" onPress={onCancel} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

