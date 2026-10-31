import { useState } from "react";
import { Alert, View } from "react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { TextField } from "@/components/TextField";
import { errorMessage } from "@/lib/errors";
import { formatRupiah } from "@/lib/format";
import type { Order } from "@/types/database";
import { useCancelOrder } from "./useOrders";

const REASONS = ["Salah input", "Pelanggan batal", "Menu habis", "Order dobel"];

/** Konfirmasi batalkan order + alasan (opsional). Tanpa PIN. */
export function CancelOrderModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const cancel = useCancelOrder();

  function confirm() {
    cancel.mutate(
      { orderId: order.id, reason },
      {
        onSuccess: onClose,
        onError: (e) => Alert.alert("Gagal membatalkan", errorMessage(e)),
      },
    );
  }

  return (
    <AppModal
      visible
      title="Batalkan Order?"
      onClose={onClose}
      footer={
        <View className="flex-row gap-3">
          <Button title="Kembali" variant="outline" className="flex-1" onPress={onClose} />
          <Button title="Ya, Batalkan" variant="action" className="flex-1" loading={cancel.isPending} onPress={confirm} />
        </View>
      }
    >
      <AppText className="mb-4">
        Order <AppText variant="heading">{order.order_number}</AppText> ({formatRupiah(order.total)}) akan dibatalkan.
        Order tidak dihitung di omzet dan stok dikembalikan.
      </AppText>
      <AppText className="mb-2 text-sm">Alasan (opsional)</AppText>
      <View className="mb-3 flex-row flex-wrap gap-2">
        {REASONS.map((r) => (
          <Chip key={r} label={r} active={reason === r} onPress={() => setReason(reason === r ? "" : r)} />
        ))}
      </View>
      <TextField label="Atau tulis sendiri" value={reason} onChangeText={setReason} placeholder="Alasan pembatalan" />
    </AppModal>
  );
}
