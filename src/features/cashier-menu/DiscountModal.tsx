import { useState } from "react";
import { TextInput, View } from "react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { colors } from "@/constants/colors";

const PRESETS = [5, 10, 15, 20, 25, 50];

/** Diskon per transaksi dalam persen. */
export function DiscountModal({
  value,
  onClose,
  onSave,
}: {
  value: number;
  onClose: () => void;
  onSave: (percent: number) => void;
}) {
  const [text, setText] = useState(value ? String(value) : "");
  const percent = Math.min(100, Math.max(0, Number(text.replace(",", ".")) || 0));

  return (
    <AppModal
      visible
      title="Diskon (%)"
      onClose={onClose}
      footer={
        <View className="flex-row gap-3">
          <Button title="Hapus Diskon" variant="outline" className="flex-1" onPress={() => onSave(0)} />
          <Button title="Pakai" className="flex-1" onPress={() => onSave(percent)} />
        </View>
      }
    >
      <View className="mb-4 flex-row flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Chip key={p} label={`${p}%`} active={percent === p} onPress={() => setText(String(p))} />
        ))}
      </View>
      <AppText className="mb-2 text-sm">Atau ketik sendiri</AppText>
      <View className="h-14 flex-row items-center rounded-2xl border border-line bg-panel px-4">
        <TextInput
          value={text}
          onChangeText={setText}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.inkMuted}
          className="h-full flex-1 font-heading text-xl text-ink"
        />
        <AppText variant="heading" className="text-xl text-ink-muted">
          %
        </AppText>
      </View>
    </AppModal>
  );
}
