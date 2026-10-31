import { useEffect, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { ImagePlus, Trash2 } from "lucide-react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { TextField } from "@/components/TextField";
import { colors } from "@/constants/colors";
import { errorMessage } from "@/lib/errors";
import { formatRupiah } from "@/lib/format";
import { pickImage } from "@/lib/images";
import type { Category, MenuItem, MenuItemWithOptions } from "@/types/database";
import { MAX_AMOUNT, digitsOnly, parseAmount } from "./amount";
import { MenuThumb } from "@/components/MenuThumb";
import { useArchiveMenuItem, useSaveMenuItem } from "./useProducts";

/**
 * Form tambah / ubah menu: nama, harga, HPP, kategori, foto.
 * item = null  -> menu baru
 * item = menu  -> ubah menu itu (ada tombol Arsipkan)
 */
export function ProductFormModal({
  visible,
  item,
  categories,
  defaultCategoryId,
  onClose,
  onCreated,
}: {
  visible: boolean;
  item: MenuItemWithOptions | null;
  categories: Category[];
  defaultCategoryId: string | null;
  onClose: () => void;
  onCreated: (item: MenuItem) => void;
}) {
  const save = useSaveMenuItem();
  const archive = useArchiveMenuItem();

  const [name, setName] = useState("");
  const [priceText, setPriceText] = useState("");
  const [costText, setCostText] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null); // foto baru (belum diupload)
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState("");

  // Isi form setiap kali popup dibuka
  useEffect(() => {
    if (!visible) return;
    setName(item?.name ?? "");
    setPriceText(item ? String(item.price) : "");
    setCostText(item?.cost_price != null ? String(item.cost_price) : "");
    setCategoryId(item ? item.category_id : defaultCategoryId);
    setImageUri(null);
    setRemoveImage(false);
    setError("");
  }, [visible, item, defaultCategoryId]);

  const currentImage = imageUri ?? (removeImage ? null : (item?.image_url ?? null));
  const price = parseAmount(priceText);
  const cost = parseAmount(costText);

  async function choosePhoto() {
    try {
      const uri = await pickImage({ square: true });
      if (uri) {
        setImageUri(uri);
        setRemoveImage(false);
      }
    } catch (e) {
      Alert.alert("Foto gagal dipilih", errorMessage(e));
    }
  }

  function clearPhoto() {
    setImageUri(null);
    setRemoveImage(true);
  }

  function submit() {
    if (!name.trim()) return setError("Nama menu wajib diisi");
    if (price === null || price <= 0) return setError("Harga jual harus lebih dari 0");
    if (price > MAX_AMOUNT) return setError("Harga jual terlalu besar");
    if (costText.trim() !== "" && (cost === null || cost > MAX_AMOUNT)) return setError("Harga modal (HPP) tidak valid");
    setError("");

    save.mutate(
      {
        id: item?.id,
        values: {
          name: name.trim(),
          price,
          cost_price: costText.trim() === "" ? null : cost,
          category_id: categoryId,
        },
        newImageUri: imageUri,
        removeImage,
        oldImageUrl: item?.image_url ?? null,
      },
      {
        onSuccess: (saved) => {
          onClose();
          if (!item) onCreated(saved);
        },
        onError: (e) => Alert.alert("Gagal menyimpan", errorMessage(e)),
      },
    );
  }

  function confirmArchive() {
    if (!item) return;
    Alert.alert(
      "Arsipkan menu?",
      `"${item.name}" tidak akan tampil lagi di menu kasir. Riwayat order lama tetap aman.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Arsipkan",
          style: "destructive",
          onPress: () =>
            archive.mutate(item.id, {
              onSuccess: onClose,
              onError: (e) => Alert.alert("Gagal mengarsipkan", errorMessage(e)),
            }),
        },
      ],
    );
  }

  return (
    <AppModal
      visible={visible}
      title={item ? "Ubah Menu" : "Tambah Menu"}
      onClose={onClose}
      footer={
        <View>
          {error ? <AppText className="mb-3 text-center text-sm text-action">{error}</AppText> : null}
          <Button title="Simpan" loading={save.isPending} onPress={submit} />
        </View>
      }
    >
      {/* Foto */}
      <View className="mb-5 flex-row items-center gap-4">
        <MenuThumb name={name || "Menu"} imageUrl={currentImage} size={96} />
        <View className="flex-1 gap-2">
          <Pressable
            onPress={choosePhoto}
            className="h-11 flex-row items-center justify-center gap-2 rounded-full border border-brand active:bg-brand-soft"
          >
            <ImagePlus size={18} color={colors.brand} />
            <AppText variant="heading" className="text-sm text-brand">
              {currentImage ? "Ganti Foto" : "Pilih Foto"}
            </AppText>
          </Pressable>
          {currentImage ? (
            <Pressable onPress={clearPhoto} className="h-9 flex-row items-center justify-center gap-2">
              <Trash2 size={16} color={colors.action} />
              <AppText className="text-sm text-action">Hapus foto</AppText>
            </Pressable>
          ) : (
            <AppText variant="muted" className="text-xs">
              Opsional. Dari galeri, otomatis dipotong persegi & dikecilkan.
            </AppText>
          )}
        </View>
      </View>

      <TextField label="Nama menu" value={name} onChangeText={setName} placeholder="Contoh: Es Kopi Susu" className="mb-4" />

      <View className="mb-4">
        <TextField
          label="Harga jual (Rp)"
          value={priceText}
          onChangeText={(t) => setPriceText(digitsOnly(t))}
          keyboardType="number-pad"
          placeholder="0"
        />
        {price ? <AppText variant="muted" className="mt-1 text-xs">{formatRupiah(price)}</AppText> : null}
      </View>

      <View className="mb-5">
        <TextField
          label="Harga modal / HPP (Rp), opsional"
          value={costText}
          onChangeText={(t) => setCostText(digitsOnly(t))}
          keyboardType="number-pad"
          placeholder="Dipakai untuk hitung laba di laporan"
        />
        {cost ? <AppText variant="muted" className="mt-1 text-xs">{formatRupiah(cost)}</AppText> : null}
      </View>

      <AppText className="mb-2 text-sm">Kategori</AppText>
      <View className="flex-row flex-wrap gap-2">
        <Chip label="Tanpa kategori" active={categoryId === null} onPress={() => setCategoryId(null)} />
        {categories.map((c) => (
          <Chip key={c.id} label={c.name} active={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
        ))}
      </View>
      {categories.length === 0 ? (
        <AppText variant="muted" className="mt-2 text-xs">
          Belum ada kategori. Buat dulu lewat tombol Kategori di halaman Kelola Produk.
        </AppText>
      ) : null}

      {item ? (
        <Pressable onPress={confirmArchive} className="mt-8 h-11 flex-row items-center justify-center gap-2">
          <Trash2 size={18} color={colors.action} />
          <AppText className="text-action">Arsipkan menu ini</AppText>
        </Pressable>
      ) : null}
    </AppModal>
  );
}
