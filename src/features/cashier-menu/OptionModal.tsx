import { useMemo, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Check, Minus, Plus } from "lucide-react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { colors } from "@/constants/colors";
import { formatRupiah } from "@/lib/format";
import type { SelectedOption } from "@/lib/pricing";
import type { MenuItemWithOptions, OptionGroup } from "@/types/database";

/**
 * Popup pilih varian (pilih tepat 1) & topping (pilih 0..max), catatan, dan jumlah.
 * unitPriceOf: hitung harga 1 porsi dari pilihan (normal / ojol), dari halaman kasir.
 */
export function OptionModal({
  item,
  maxQty,
  unitPriceOf,
  onClose,
  onAdd,
}: {
  item: MenuItemWithOptions;
  maxQty: number; // sisa stok yang boleh ditambahkan (Infinity kalau tanpa stok)
  unitPriceOf: (options: SelectedOption[]) => number;
  onClose: () => void;
  onAdd: (options: SelectedOption[], note: string, qty: number) => void;
}) {
  // Varian: otomatis pilih pilihan pertama supaya kasir lebih cepat
  const [selected, setSelected] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      item.option_groups.map((g) => [g.id, g.type === "variant" && g.options[0] ? [g.options[0].id] : []]),
    ),
  );
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);

  const chosen: SelectedOption[] = useMemo(
    () =>
      item.option_groups.flatMap((g) =>
        g.options
          .filter((o) => selected[g.id]?.includes(o.id))
          .map((o) => ({ group: g.name, name: o.name, price_delta: o.price_delta })),
      ),
    [item, selected],
  );

  const missing = item.option_groups.filter(
    (g) => (g.type === "variant" || g.is_required) && (selected[g.id]?.length ?? 0) === 0,
  );
  const unitPrice = unitPriceOf(chosen);

  function toggle(group: OptionGroup, optionId: string) {
    setSelected((prev) => {
      const current = prev[group.id] ?? [];
      if (group.type === "variant") return { ...prev, [group.id]: [optionId] };
      if (current.includes(optionId)) return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
      if (current.length >= group.max_select) return prev; // sudah maksimal
      return { ...prev, [group.id]: [...current, optionId] };
    });
  }

  return (
    <AppModal
      visible
      title={item.name}
      onClose={onClose}
      footer={
        <View className="flex-row items-center gap-3">
          <View className="h-14 flex-row items-center rounded-full bg-panel">
            <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} className="h-14 w-12 items-center justify-center">
              <Minus size={20} color={colors.ink} />
            </Pressable>
            <AppText variant="heading" className="w-8 text-center text-lg">
              {qty}
            </AppText>
            <Pressable
              onPress={() => setQty((q) => Math.min(maxQty, q + 1))}
              disabled={qty >= maxQty}
              className={`h-14 w-12 items-center justify-center ${qty >= maxQty ? "opacity-30" : ""}`}
            >
              <Plus size={20} color={colors.ink} />
            </Pressable>
          </View>
          <Button
            title={missing.length ? `Pilih ${missing[0].name}` : `Tambah • ${formatRupiah(unitPrice * qty)}`}
            variant="action"
            disabled={missing.length > 0}
            className="flex-1"
            onPress={() => onAdd(chosen, note, qty)}
          />
        </View>
      }
    >
      {item.option_groups.map((group) => (
        <View key={group.id} className="mb-5">
          <View className="mb-2 flex-row items-center justify-between">
            <AppText variant="heading" className="text-base">
              {group.name}
            </AppText>
            <AppText variant="muted" className="text-xs">
              {group.type === "variant"
                ? "Wajib, pilih 1"
                : `${group.is_required ? "Wajib" : "Opsional"}, maks ${group.max_select}`}
            </AppText>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {group.options.map((option) => {
              const active = selected[group.id]?.includes(option.id);
              return (
                <Pressable
                  key={option.id}
                  onPress={() => toggle(group, option.id)}
                  className={`min-h-12 flex-row items-center gap-2 rounded-2xl border px-4 py-2 ${
                    active ? "border-brand bg-brand-soft" : "border-line bg-white active:bg-panel"
                  }`}
                >
                  {active ? <Check size={16} color={colors.brand} /> : null}
                  <AppText className={`text-sm ${active ? "font-heading text-brand" : ""}`}>{option.name}</AppText>
                  {option.price_delta > 0 ? (
                    <AppText variant="muted" className="text-xs">
                      +{formatRupiah(option.price_delta)}
                    </AppText>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <AppText variant="heading" className="mb-2 text-base">
        Catatan
      </AppText>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Contoh: tidak pakai bawang"
        placeholderTextColor={colors.inkMuted}
        className="h-12 rounded-2xl border border-line bg-panel px-4 font-sans text-base text-ink"
      />
    </AppModal>
  );
}
