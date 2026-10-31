import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteImage, uploadImage } from "@/lib/images";
import { queryKeys } from "@/lib/queryClient";
import { getSupabase } from "@/lib/supabase";
import type { Category, MenuItem } from "@/types/database";
import type { OptionGroupRow, OptionRow } from "./optionDraft";

/**
 * Semua cara MENYIMPAN data Kelola Produk (kategori, menu, foto, varian & topping).
 * Untuk MEMBACA data pakai useMenuItems() dan useCategories() dari "@/hooks/useMenu".
 */

// ---------------------------------------------------------------- Menu

export type MenuValues = {
  name: string;
  price: number;
  cost_price: number | null;
  category_id: string | null;
};

/** Nomor urut untuk menu baru: ditaruh paling bawah di kategorinya. */
async function nextMenuSortOrder(categoryId: string | null): Promise<number> {
  let query = getSupabase()
    .from("menu_items")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  query = categoryId ? query.eq("category_id", categoryId) : query.is("category_id", null);
  const { data, error } = await query;
  if (error) throw error;
  return ((data?.[0]?.sort_order as number | undefined) ?? 0) + 1;
}

/**
 * Tambah / ubah menu sekaligus foto-nya.
 * - newImageUri : foto baru (uri lokal hasil pickImage) -> diupload dulu
 * - removeImage : true = foto dihapus (menu kembali pakai kotak inisial)
 * Foto lama di Storage dihapus setelah menu berhasil disimpan.
 */
export function useSaveMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      values: MenuValues;
      newImageUri: string | null;
      removeImage: boolean;
      oldImageUrl: string | null;
    }): Promise<MenuItem> => {
      const supabase = getSupabase();

      const uploadedUrl = input.newImageUri ? await uploadImage("menu-images", input.newImageUri) : null;
      const imageChange: { image_url?: string | null } = uploadedUrl
        ? { image_url: uploadedUrl }
        : input.removeImage
          ? { image_url: null }
          : {};

      try {
        let saved: MenuItem;
        if (input.id) {
          const { data, error } = await supabase
            .from("menu_items")
            .update({ ...input.values, ...imageChange })
            .eq("id", input.id)
            .select()
            .single();
          if (error) throw error;
          saved = data as MenuItem;
        } else {
          const sort_order = await nextMenuSortOrder(input.values.category_id);
          const { data, error } = await supabase
            .from("menu_items")
            .insert({ ...input.values, ...imageChange, sort_order })
            .select()
            .single();
          if (error) throw error;
          saved = data as MenuItem;
        }

        if ((uploadedUrl || input.removeImage) && input.oldImageUrl) {
          await deleteImage("menu-images", input.oldImageUrl);
        }
        return saved;
      } catch (error) {
        // menu gagal disimpan -> jangan tinggalkan foto yatim di Storage
        if (uploadedUrl) await deleteImage("menu-images", uploadedUrl);
        throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.menu }),
  });
}

/** "Hapus" menu = diarsipkan (order lama tetap menampilkan namanya). */
export function useArchiveMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase().from("menu_items").update({ is_archived: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu });
      queryClient.invalidateQueries({ queryKey: queryKeys.stock });
    },
  });
}

// ---------------------------------------------------------------- Kategori

export function useAddCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, sortOrder }: { name: string; sortOrder: number }) => {
      const { error } = await getSupabase().from("categories").insert({ name, sort_order: sortOrder });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
  });
}

export function useRenameCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await getSupabase().from("categories").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
  });
}

/**
 * Arsipkan kategori. Menu di dalamnya dipindah jadi "Tanpa kategori"
 * supaya tidak hilang dari daftar menu.
 */
export function useArchiveCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabase();
      const moved = await supabase.from("menu_items").update({ category_id: null }).eq("category_id", id);
      if (moved.error) throw moved.error;
      const { error } = await supabase.from("categories").update({ is_archived: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      queryClient.invalidateQueries({ queryKey: queryKeys.menu });
    },
  });
}

/** Simpan urutan kategori sesuai urutan array (hanya yang berubah yang diupdate). */
export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ordered: Category[]) => {
      const supabase = getSupabase();
      const changed = ordered
        .map((category, index) => ({ category, sort_order: index + 1 }))
        .filter(({ category, sort_order }) => category.sort_order !== sort_order);
      const results = await Promise.all(
        changed.map(({ category, sort_order }) =>
          supabase.from("categories").update({ sort_order }).eq("id", category.id),
        ),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
  });
}

// ---------------------------------------------------------------- Varian & topping

/**
 * Ganti seluruh varian & topping sebuah menu dengan versi baru.
 * Urutan dibuat aman: grup baru disimpan DULU, baru grup lama dihapus,
 * jadi kalau gagal di tengah jalan, data lama tidak hilang.
 */
export function useSaveOptions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      menuItemId,
      groups,
      options,
    }: {
      menuItemId: string;
      groups: OptionGroupRow[];
      options: OptionRow[];
    }) => {
      const supabase = getSupabase();
      const newGroupIds = groups.map((g) => g.id);

      if (groups.length > 0) {
        const insertedGroups = await supabase.from("option_groups").insert(groups);
        if (insertedGroups.error) throw insertedGroups.error;

        if (options.length > 0) {
          const insertedOptions = await supabase.from("options").insert(options);
          if (insertedOptions.error) {
            await supabase.from("option_groups").delete().in("id", newGroupIds); // batalkan grup baru
            throw insertedOptions.error;
          }
        }
      }

      // hapus semua grup lama milik menu ini (selain yang baru saja disimpan)
      let cleanup = supabase.from("option_groups").delete().eq("menu_item_id", menuItemId);
      if (newGroupIds.length > 0) cleanup = cleanup.not("id", "in", `(${newGroupIds.join(",")})`);
      const { error } = await cleanup;
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.menu }),
  });
}
