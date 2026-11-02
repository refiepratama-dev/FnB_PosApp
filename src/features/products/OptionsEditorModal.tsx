import { useEffect, useState } from "react";
import { Alert, Pressable, Switch, TextInput, View } from "react-native";
import { Minus, Plus, Trash2 } from "lucide-react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";
import { colors } from "@/constants/colors";
import { errorMessage } from "@/lib/errors";
import type { MenuItemWithOptions } from "@/types/database";
import { digitsOnly, groupThousands } from "./amount";
import {
  buildRows,
  newDraftGroup,
  newDraftOption,
  toDraftGroups,
  validateDraftGroups,
  type DraftGroup,
} from "./optionDraft";
import { useSaveOptions } from "./useProducts";

const CELL_CLASS = "h-12 rounded-xl border border-line bg-panel px-3 font-sans text-base text-ink focus:border-brand";

/**
 * Editor varian & topping satu menu.
 * - Varian (misal Ukuran, Saus): pelanggan memilih TEPAT 1.
 * - Topping (misal Tambahan): pelanggan boleh memilih 0 sampai "maks dipilih".
 * Harga pilihan = tambahan harga di atas harga dasar menu (Regular +0, Large +5.000).
 */
export function OptionsEditorModal({ menu, onClose }: { menu: MenuItemWithOptions | null; onClose: () => void }) {
  const save = useSaveOptions();
  const [groups, setGroups] = useState<DraftGroup[]>([]);
  const [error, setError] = useState("");

  // Isi draf dari data menu setiap kali popup dibuka untuk menu tertentu
  useEffect(() => {
    if (menu) {
      setGroups(toDraftGroups(menu.option_groups ?? []));
      setError("");
    }
  }, [menu]);

  function updateGroup(key: string, change: Partial<DraftGroup>) {
    setGroups((current) => current.map((g) => (g.key === key ? { ...g, ...change } : g)));
  }

  function removeGroup(key: string) {
    setGroups((current) => current.filter((g) => g.key !== key));
  }

  function addOption(key: string) {
    setGroups((current) => current.map((g) => (g.key === key ? { ...g, options: [...g.options, newDraftOption()] } : g)));
  }

  function updateOption(groupKey: string, optionKey: string, change: { name?: string; price?: string }) {
    setGroups((current) =>
      current.map((g) =>
        g.key === groupKey ? { ...g, options: g.options.map((o) => (o.key === optionKey ? { ...o, ...change } : o)) } : g,
      ),
    );
  }

  function removeOption(groupKey: string, optionKey: string) {
    setGroups((current) =>
      current.map((g) => (g.key === groupKey ? { ...g, options: g.options.filter((o) => o.key !== optionKey) } : g)),
    );
  }

  function submit() {
    if (!menu) return;
    const problem = validateDraftGroups(groups);
    if (problem) return setError(problem);
    setError("");

    const rows = buildRows(menu.id, groups);
    save.mutate(
      { menuItemId: menu.id, groups: rows.groups, options: rows.options },
      {
        onSuccess: onClose,
        onError: (e) => Alert.alert("Gagal menyimpan", errorMessage(e)),
      },
    );
  }

  return (
    <AppModal
      visible={menu !== null}
      title={menu ? `Varian & Topping: ${menu.name}` : "Varian & Topping"}
      size="lg"
      onClose={onClose}
      footer={
        <View>
          {error ? <AppText className="mb-3 text-center text-sm text-action">{error}</AppText> : null}
          <Button title="Simpan" loading={save.isPending} onPress={submit} />
        </View>
      }
    >
      {groups.length === 0 ? (
        <View className="mb-4 items-center rounded-2xl bg-panel p-5">
          <AppText variant="heading" className="text-center">
            Belum ada varian atau topping
          </AppText>
          <AppText variant="muted" className="mt-1 text-center text-sm">
            Tambahkan kalau menu ini punya pilihan, misalnya ukuran, level pedas, atau tambahan telur.
          </AppText>
        </View>
      ) : null}

      {groups.map((group) => {
        const isVariant = group.type === "variant";
        return (
          <Card key={group.key} className="mb-4">
            <View className="mb-3 flex-row items-center justify-between">
              <View className={`rounded-full px-3 py-1 ${isVariant ? "bg-brand-soft" : "bg-action-soft"}`}>
                <AppText variant="heading" className={`text-xs ${isVariant ? "text-brand" : "text-action"}`}>
                  {isVariant ? "VARIAN" : "TOPPING"}
                </AppText>
              </View>
              <Pressable
                onPress={() => removeGroup(group.key)}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-full active:bg-panel"
              >
                <Trash2 size={18} color={colors.action} />
              </Pressable>
            </View>

            <TextField
              label="Nama grup"
              value={group.name}
              onChangeText={(name) => updateGroup(group.key, { name })}
              placeholder={isVariant ? "Contoh: Ukuran, Saus, Suhu" : "Contoh: Tambahan, Extra"}
              className="mb-2"
            />
            <AppText variant="muted" className="mb-3 text-xs">
              {isVariant
                ? "Pelanggan harus memilih tepat 1 pilihan."
                : "Pelanggan boleh memilih beberapa pilihan, atau tidak sama sekali."}
            </AppText>

            {!isVariant ? (
              <View className="mb-3 gap-3 rounded-2xl bg-panel p-3">
                <View className="flex-row items-center justify-between">
                  <AppText className="mr-3 flex-1 text-sm">Wajib pilih minimal 1</AppText>
                  <Switch
                    value={group.required}
                    onValueChange={(required) => updateGroup(group.key, { required })}
                    trackColor={{ false: colors.line, true: colors.brand }}
                    thumbColor={colors.white}
                  />
                </View>
                <View className="flex-row items-center justify-between">
                  <AppText className="mr-3 flex-1 text-sm">Maksimal dipilih</AppText>
                  <View className="flex-row items-center gap-3">
                    <Pressable
                      onPress={() => updateGroup(group.key, { maxSelect: Math.max(1, group.maxSelect - 1) })}
                      className="h-9 w-9 items-center justify-center rounded-full bg-white active:bg-line"
                    >
                      <Minus size={16} color={colors.ink} />
                    </Pressable>
                    <AppText variant="heading" className="w-6 text-center">
                      {Math.min(group.maxSelect, Math.max(1, group.options.length))}
                    </AppText>
                    <Pressable
                      onPress={() =>
                        updateGroup(group.key, {
                          maxSelect: Math.min(Math.max(1, group.options.length), group.maxSelect + 1),
                        })
                      }
                      className="h-9 w-9 items-center justify-center rounded-full bg-white active:bg-line"
                    >
                      <Plus size={16} color={colors.ink} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}

            <View className="mb-1 flex-row gap-2 px-1">
              <AppText variant="muted" className="flex-1 text-xs">
                Pilihan
              </AppText>
              <AppText variant="muted" className="w-32 text-xs">
                Tambahan harga (Rp)
              </AppText>
              <View className="w-9" />
            </View>
            {group.options.map((option) => (
              <View key={option.key} className="mb-2 flex-row items-center gap-2">
                <TextInput
                  value={option.name}
                  onChangeText={(name) => updateOption(group.key, option.key, { name })}
                  placeholder={isVariant ? "Contoh: Large" : "Contoh: Telur"}
                  placeholderTextColor={colors.inkMuted}
                  className={`${CELL_CLASS} flex-1`}
                />
                <TextInput
                  value={groupThousands(option.price)}
                  onChangeText={(price) => updateOption(group.key, option.key, { price: digitsOnly(price) })}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.inkMuted}
                  className={`${CELL_CLASS} w-32`}
                />
                <Pressable
                  onPress={() => removeOption(group.key, option.key)}
                  hitSlop={4}
                  className="h-9 w-9 items-center justify-center rounded-full active:bg-panel"
                >
                  <Trash2 size={16} color={colors.inkMuted} />
                </Pressable>
              </View>
            ))}

            <Pressable
              onPress={() => addOption(group.key)}
              className="mt-1 h-11 flex-row items-center justify-center gap-2 rounded-full border border-dashed border-brand active:bg-brand-soft"
            >
              <Plus size={16} color={colors.brand} />
              <AppText className="text-sm text-brand">Tambah pilihan</AppText>
            </Pressable>
          </Card>
        );
      })}

      <View className="flex-row gap-3">
        <Pressable
          onPress={() => setGroups((current) => [...current, newDraftGroup("variant")])}
          className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full border border-brand active:bg-brand-soft"
        >
          <Plus size={18} color={colors.brand} />
          <AppText variant="heading" className="text-sm text-brand">
            Varian
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => setGroups((current) => [...current, newDraftGroup("addon")])}
          className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full border border-brand active:bg-brand-soft"
        >
          <Plus size={18} color={colors.brand} />
          <AppText variant="heading" className="text-sm text-brand">
            Topping
          </AppText>
        </Pressable>
      </View>
    </AppModal>
  );
}
