import { useState } from "react";
import { Alert, Pressable, TextInput, View } from "react-native";
import { Archive, Check, ChevronDown, ChevronUp, Pencil, Plus, X } from "lucide-react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { colors } from "@/constants/colors";
import { errorMessage } from "@/lib/errors";
import type { Category, MenuItem } from "@/types/database";
import { useAddCategory, useArchiveCategory, useRenameCategory, useReorderCategories } from "./useProducts";

const INPUT_CLASS = "h-12 flex-1 rounded-2xl border border-line bg-panel px-4 font-sans text-base text-ink focus:border-brand";

function IconButton({
  icon: Icon,
  onPress,
  disabled = false,
  color = colors.ink,
}: {
  icon: typeof Plus;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      className={`h-9 w-9 items-center justify-center rounded-full active:bg-panel ${disabled ? "opacity-30" : ""}`}
    >
      <Icon size={18} color={color} />
    </Pressable>
  );
}

/** Kelola kategori: tambah, ganti nama, atur urutan, arsipkan. */
export function CategoryManagerModal({
  visible,
  categories,
  items,
  onClose,
}: {
  visible: boolean;
  categories: Category[]; // kategori aktif, sudah urut
  items: MenuItem[]; // untuk menghitung jumlah menu per kategori
  onClose: () => void;
}) {
  const add = useAddCategory();
  const rename = useRenameCategory();
  const archive = useArchiveCategory();
  const reorder = useReorderCategories();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const countOf = (id: string) => items.filter((m) => m.category_id === id).length;
  const nameTaken = (name: string, exceptId?: string) =>
    categories.some((c) => c.id !== exceptId && c.name.trim().toLowerCase() === name.trim().toLowerCase());

  function submitNew() {
    const name = newName.trim();
    if (!name) return;
    if (nameTaken(name)) return Alert.alert("Nama sudah dipakai", `Kategori "${name}" sudah ada.`);
    const sortOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), 0) + 1;
    add.mutate(
      { name, sortOrder },
      {
        onSuccess: () => setNewName(""),
        onError: (e) => Alert.alert("Gagal menambah kategori", errorMessage(e)),
      },
    );
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
  }

  function submitEdit(category: Category) {
    const name = editName.trim();
    if (!name) return;
    if (name === category.name) return setEditingId(null);
    if (nameTaken(name, category.id)) return Alert.alert("Nama sudah dipakai", `Kategori "${name}" sudah ada.`);
    rename.mutate(
      { id: category.id, name },
      {
        onSuccess: () => setEditingId(null),
        onError: (e) => Alert.alert("Gagal mengubah nama", errorMessage(e)),
      },
    );
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next, { onError: (e) => Alert.alert("Gagal mengubah urutan", errorMessage(e)) });
  }

  function confirmArchive(category: Category) {
    const count = countOf(category.id);
    const note = count > 0 ? ` ${count} menu di dalamnya akan menjadi "Tanpa kategori".` : "";
    Alert.alert("Arsipkan kategori?", `Kategori "${category.name}" tidak akan tampil lagi.${note}`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Arsipkan",
        style: "destructive",
        onPress: () =>
          archive.mutate(category.id, {
            onError: (e) => Alert.alert("Gagal mengarsipkan", errorMessage(e)),
          }),
      },
    ]);
  }

  return (
    <AppModal visible={visible} title="Kelola Kategori" onClose={onClose}>
      <View className="mb-5 flex-row items-center gap-2">
        <TextInput
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={submitNew}
          returnKeyType="done"
          placeholder="Nama kategori baru"
          placeholderTextColor={colors.inkMuted}
          className={INPUT_CLASS}
        />
        <Pressable
          onPress={submitNew}
          disabled={add.isPending || !newName.trim()}
          className={`h-12 flex-row items-center gap-1 rounded-full bg-brand px-5 active:opacity-80 ${
            add.isPending || !newName.trim() ? "opacity-50" : ""
          }`}
        >
          <Plus size={18} color={colors.white} />
          <AppText variant="heading" className="text-sm text-white">
            Tambah
          </AppText>
        </Pressable>
      </View>

      {categories.length === 0 ? (
        <AppText variant="muted" className="py-6 text-center">
          Belum ada kategori.
        </AppText>
      ) : (
        <View className="overflow-hidden rounded-2xl border border-line">
          {categories.map((category, index) => (
            <View
              key={category.id}
              className={`min-h-16 flex-row items-center gap-1 px-3 py-2 ${index > 0 ? "border-t border-line" : ""}`}
            >
              {editingId === category.id ? (
                <>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    onSubmitEditing={() => submitEdit(category)}
                    returnKeyType="done"
                    autoFocus
                    className="mr-1 h-11 flex-1 rounded-xl border border-brand bg-panel px-3 font-sans text-base text-ink"
                  />
                  <IconButton icon={Check} color={colors.success} disabled={rename.isPending} onPress={() => submitEdit(category)} />
                  <IconButton icon={X} onPress={() => setEditingId(null)} />
                </>
              ) : (
                <>
                  <View className="mr-1 flex-1">
                    <AppText variant="heading" numberOfLines={1}>
                      {category.name}
                    </AppText>
                    <AppText variant="muted" className="text-xs">
                      {countOf(category.id)} menu
                    </AppText>
                  </View>
                  <IconButton icon={ChevronUp} disabled={index === 0 || reorder.isPending} onPress={() => move(index, -1)} />
                  <IconButton
                    icon={ChevronDown}
                    disabled={index === categories.length - 1 || reorder.isPending}
                    onPress={() => move(index, 1)}
                  />
                  <IconButton icon={Pencil} onPress={() => startEdit(category)} />
                  <IconButton icon={Archive} color={colors.action} onPress={() => confirmArchive(category)} />
                </>
              )}
            </View>
          ))}
        </View>
      )}
    </AppModal>
  );
}
