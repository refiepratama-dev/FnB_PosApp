import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { getSupabase } from "./supabase";

export type Bucket = "menu-images" | "store-assets" | "expense-receipts";

const MAX_ORIGINAL_BYTES = 10 * 1024 * 1024; // 10 MB (docs/03-FEATURES.md)
const MAX_SIZE = 800; // px

/**
 * Pilih foto dari GALERI, lalu kecilkan & kompres (JPEG).
 * - square: true  -> dipotong persegi 1:1 (foto menu)
 * - square: false -> bentuk asli (foto nota pengeluaran)
 * Mengembalikan uri file lokal, null kalau batal, atau melempar error dengan pesan Indonesia.
 *
 *   const uri = await pickImage({ square: true });
 *   if (uri) { const url = await uploadImage("menu-images", uri); }
 */
export async function pickImage({ square }: { square: boolean }): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error("Izin galeri ditolak. Aktifkan di pengaturan HP.");

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: square ? [1, 1] : undefined,
    quality: 1,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > MAX_ORIGINAL_BYTES) {
    throw new Error("Ukuran foto terlalu besar (maksimal 10 MB)");
  }

  let context = ImageManipulator.manipulate(asset.uri);
  if (square) {
    // pastikan benar-benar persegi (potong bagian tengah)
    const side = Math.min(asset.width, asset.height);
    context = context.crop({
      originX: Math.floor((asset.width - side) / 2),
      originY: Math.floor((asset.height - side) / 2),
      width: side,
      height: side,
    });
    context = context.resize({ width: Math.min(side, MAX_SIZE), height: Math.min(side, MAX_SIZE) });
  } else if (Math.max(asset.width, asset.height) > MAX_SIZE * 1.5) {
    const longEdge = MAX_SIZE * 1.5; // nota boleh sedikit lebih besar supaya tulisan terbaca
    context =
      asset.width >= asset.height ? context.resize({ width: longEdge }) : context.resize({ height: longEdge });
  }

  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7 });
  return saved.uri;
}

/** Upload foto ke Supabase Storage. Mengembalikan URL publik foto. */
export async function uploadImage(bucket: Bucket, localUri: string): Promise<string> {
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const body = await (await fetch(localUri)).arrayBuffer();

  const supabase = getSupabase();
  const { error } = await supabase.storage.from(bucket).upload(fileName, body, { contentType: "image/jpeg" });
  if (error) throw error;

  return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
}

/** Hapus foto lama dari Storage (misal saat foto menu diganti). Aman kalau gagal. */
export async function deleteImage(bucket: Bucket, publicUrl: string | null) {
  if (!publicUrl) return;
  const fileName = publicUrl.split(`/${bucket}/`)[1];
  if (fileName) await getSupabase().storage.from(bucket).remove([fileName]);
}
