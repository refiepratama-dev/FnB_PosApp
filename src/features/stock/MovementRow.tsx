import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { formatDateTime } from "@/lib/format";
import { MOVEMENT_LABEL } from "./stockQty";
import type { StockMovementWithName } from "./useStock";

/** Satu baris riwayat stok: jenis, perubahan (+/-), sisa, catatan, waktu. */
export function MovementRow({ movement, showName = false }: { movement: StockMovementWithName; showName?: boolean }) {
  const change = movement.qty_change;
  const changeClass = change > 0 ? "text-success" : change < 0 ? "text-action" : "text-ink-muted";

  return (
    <View className="flex-row items-center gap-3 border-b border-line py-3">
      <View className="flex-1">
        {showName ? (
          <AppText variant="heading" numberOfLines={1}>
            {movement.menu_items?.name ?? "Menu dihapus"}
          </AppText>
        ) : null}
        <AppText className={showName ? "text-sm" : ""}>{MOVEMENT_LABEL[movement.type]}</AppText>
        {movement.note ? (
          <AppText variant="muted" className="text-xs" numberOfLines={2}>
            {movement.note}
          </AppText>
        ) : null}
        <AppText variant="muted" className="text-xs">
          {formatDateTime(movement.created_at)}
        </AppText>
      </View>
      <View className="items-end">
        <AppText variant="heading" className={`text-lg ${changeClass}`}>
          {change > 0 ? `+${change}` : String(change)}
        </AppText>
        <AppText variant="muted" className="text-xs">
          sisa {movement.qty_after}
        </AppText>
      </View>
    </View>
  );
}
