import { MAX_AMOUNT, parseAmount } from "./amount";
import { newId } from "./ids";
import type { Option, OptionGroup } from "@/types/database";

/**
 * Draf varian & topping yang sedang diedit di layar (belum disimpan ke database).
 * Semua fungsi di file ini murni (tanpa React Native) supaya mudah dites.
 */
export type DraftOption = { key: string; name: string; price: string };
export type DraftGroup = {
  key: string;
  name: string;
  type: "variant" | "addon";
  required: boolean; // hanya dipakai topping: wajib pilih minimal 1?
  maxSelect: number; // hanya dipakai topping: maksimal boleh dipilih
  options: DraftOption[];
};

export type GroupWithOptions = OptionGroup & { options: Option[] };

export function newDraftOption(): DraftOption {
  return { key: newId(), name: "", price: "" };
}

export function newDraftGroup(type: DraftGroup["type"]): DraftGroup {
  return {
    key: newId(),
    name: "",
    type,
    required: type === "variant",
    maxSelect: 1,
    options: [newDraftOption()],
  };
}

/** Data dari database -> draf untuk diedit. */
export function toDraftGroups(groups: GroupWithOptions[]): DraftGroup[] {
  return [...groups]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((g) => ({
      key: g.id,
      name: g.name,
      type: g.type,
      required: g.type === "variant" ? true : g.is_required,
      maxSelect: g.max_select,
      options: [...(g.options ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((o) => ({ key: o.id, name: o.name, price: o.price_delta ? String(o.price_delta) : "" })),
    }));
}

/** Cek draf sebelum disimpan. Mengembalikan pesan error (bahasa Indonesia) atau null kalau aman. */
export function validateDraftGroups(groups: DraftGroup[]): string | null {
  const groupNames = new Set<string>();

  for (const [index, group] of groups.entries()) {
    const groupName = group.name.trim();
    if (!groupName) return `Nama grup ke-${index + 1} belum diisi`;
    if (groupNames.has(groupName.toLowerCase())) return `Nama grup "${groupName}" dobel`;
    groupNames.add(groupName.toLowerCase());

    if (group.options.length === 0) return `Grup "${groupName}" belum punya pilihan`;

    const optionNames = new Set<string>();
    for (const option of group.options) {
      const optionName = option.name.trim();
      if (!optionName) return `Ada pilihan di grup "${groupName}" yang namanya masih kosong`;
      if (optionNames.has(optionName.toLowerCase())) return `Pilihan "${optionName}" di grup "${groupName}" dobel`;
      optionNames.add(optionName.toLowerCase());

      if (option.price.trim() !== "") {
        const price = parseAmount(option.price);
        if (price === null) return `Harga tambahan "${optionName}" tidak valid`;
        if (price > MAX_AMOUNT) return `Harga tambahan "${optionName}" terlalu besar`;
      }
    }
  }
  return null;
}

export type OptionGroupRow = {
  id: string;
  menu_item_id: string;
  name: string;
  type: "variant" | "addon";
  is_required: boolean;
  max_select: number;
  sort_order: number;
};
export type OptionRow = { id: string; group_id: string; name: string; price_delta: number; sort_order: number };

/**
 * Draf -> baris siap insert ke tabel option_groups & options.
 * - Varian: selalu wajib & pilih tepat 1.
 * - Topping: max_select dibatasi antara 1 dan jumlah pilihannya.
 */
export function buildRows(menuItemId: string, groups: DraftGroup[]): { groups: OptionGroupRow[]; options: OptionRow[] } {
  const groupRows: OptionGroupRow[] = [];
  const optionRows: OptionRow[] = [];

  groups.forEach((group, groupIndex) => {
    const groupId = newId();
    const isVariant = group.type === "variant";
    groupRows.push({
      id: groupId,
      menu_item_id: menuItemId,
      name: group.name.trim(),
      type: group.type,
      is_required: isVariant ? true : group.required,
      max_select: isVariant ? 1 : Math.min(Math.max(1, group.maxSelect), Math.max(1, group.options.length)),
      sort_order: groupIndex + 1,
    });
    group.options.forEach((option, optionIndex) => {
      optionRows.push({
        id: newId(),
        group_id: groupId,
        name: option.name.trim(),
        price_delta: parseAmount(option.price) ?? 0,
        sort_order: optionIndex + 1,
      });
    });
  });

  return { groups: groupRows, options: optionRows };
}

/** Ringkasan untuk daftar menu, misal "2 varian · 1 topping". Kosong kalau belum ada. */
export function summarizeOptions(groups: { type: "variant" | "addon" }[] | undefined): string {
  const list = groups ?? [];
  const variants = list.filter((g) => g.type === "variant").length;
  const addons = list.filter((g) => g.type === "addon").length;
  return [variants ? `${variants} varian` : "", addons ? `${addons} topping` : ""].filter(Boolean).join(" · ");
}
