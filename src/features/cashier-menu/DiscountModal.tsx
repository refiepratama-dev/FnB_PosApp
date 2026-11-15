import { useState } from "react";
import { TextInput, View } from "react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { colors } from "@/constants/colors";
import { formatRupiah } from "@/lib/format";
import { discountAmountOf, type Discount } from "@/lib/pricing";

const PERCENT_PRESETS = [5, 10, 15, 20, 25, 50];
const RUPIAH_PRESETS = [2000, 5000, 10000, 20000];

/** "15.000" / "Rp15.000" -> 15000 */
function parseRupiah(text: string): number {
  return Number(text.replace(/[^\d]/g, "")) || 0;
}

/** Diskon per transaksi: persen (%) atau potongan Rupiah (Rp). */
export function DiscountModal({
  value,
  subtotal,
  onClose,
  onSave,
}: {
  value: Discount;
  subtotal: number;
  onClose: () => void;
  onSave: (discount: Discount) => void;
}) {
  const [type, setType] = useState<Discount["type"]>(value.type);
  const [text, setText] = useState(value.value ? String(value.value) : "");

  const percent = Math.min(100, Math.max(0, Number(text.replace(",", ".")) || 0));
  const rupiah = parseRupiah(text);
  const discount: Discount = type === "percent" ? { type, value: percent } : { type, value: rupiah };
  const amount = discountAmountOf(subtotal, discount);
  const overSubtotal = type === "amount" && rupiah > subtotal && subtotal > 0;

  function switchType(next: Discount["type"]) {
    if (next === type) return;
    setType(next);
    setText(""); // angka persen dan Rupiah beda arti, jadi dikosongkan
  }

  return (
    <AppModal
      visible
      title="Diskon"
      onClose={onClose}
      footer={
        <View className="flex-row gap-3">
          <Button title="Hapus Diskon" variant="action" className="flex-1" onPress={() => onSave({ type: "percent", value: 0 })} />
          <Button
            title="Pakai"
            className="flex-1"
            onPress={() => onSave(type === "amount" ? { type, value: Math.min(rupiah, subtotal) } : discount)}
          />
        </View>
      }
    >
      <View className="mb-4 flex-row gap-2">
        <Chip label="Persen (%)" active={type === "percent"} onPress={() => switchType("percent")} />
        <Chip label="Rupiah (Rp)" active={type === "amount"} onPress={() => switchType("amount")} />
      </View>

      <View className="mb-4 flex-row flex-wrap gap-2">
        {type === "percent"
          ? PERCENT_PRESETS.map((p) => <Chip key={p} label={`${p}%`} active={percent === p} onPress={() => setText(String(p))} />)
          : RUPIAH_PRESETS.map((r) => (
              <Chip key={r} label={formatRupiah(r)} active={rupiah === r} onPress={() => setText(String(r))} />
            ))}
      </View>

      <AppText className="mb-2 text-sm">Atau ketik sendiri</AppText>
      <View className="h-14 flex-row items-center rounded-2xl border border-line bg-panel px-4">
        {type === "amount" ? (
          <AppText variant="heading" className="mr-1 text-xl text-ink-muted">
            Rp
          </AppText>
        ) : null}
        <TextInput
          value={type === "amount" && rupiah ? rupiah.toLocaleString("id-ID") : text}
          onChangeText={setText}
          keyboardType={type === "amount" ? "number-pad" : "decimal-pad"}
          placeholder="0"
          placeholderTextColor={colors.inkMuted}
          className="h-full flex-1 font-heading text-xl text-ink"
        />
        {type === "percent" ? (
          <AppText variant="heading" className="text-xl text-ink-muted">
            %
          </AppText>
        ) : null}
      </View>

      <AppText variant="muted" className={`mt-3 text-sm ${overSubtotal ? "text-action" : ""}`}>
        {overSubtotal
          ? `Melebihi subtotal. Diskon dipakai maksimal ${formatRupiah(subtotal)}.`
          : `Potongan: ${formatRupiah(amount)} dari subtotal ${formatRupiah(subtotal)}`}
      </AppText>
    </AppModal>
  );
}
