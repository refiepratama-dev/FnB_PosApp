# Panduan Coding TemanPOS

Baca ini sebelum mulai mengerjakan fitur. Kalau bingung, tiru contoh di sini.

## 1. Siapa mengerjakan folder mana

Setiap orang **hanya mengubah folder miliknya**, supaya tidak bentrok (konflik Git).

| Folder | Penanggung jawab | Isi |
|--------|------------------|-----|
| `src/features/cashier-menu/` | Refie | Halaman Menu kasir, keranjang, popup varian, bayar, Order Selesai |
| `src/features/orders/` | Refie | Riwayat order, detail, batalkan |
| `src/features/products/` | Ridho | Kelola kategori, menu, foto, varian & topping |
| `src/features/stock/` | Ridho | Halaman Stok |
| `src/features/members/` | Ridho | Halaman Member |
| `src/features/expenses/` | Fahri | Halaman Pengeluaran |
| `src/features/reports/` | Fahri | Laporan / Report |
| `src/features/dashboard/` | Fahri | Dashboard owner |
| `src/features/settings/` | Fahri | Setting |

**Folder bersama** (`src/components`, `src/hooks`, `src/lib`, `src/types`, `src/app`, `supabase/`):
jangan diubah sendiri. Kalau butuh perubahan, bilang ke Refie dulu.

**Database** (`supabase/migrations/`) hanya diubah Refie.

## 2. Struktur di dalam folder fitur

```
src/features/products/
  ProductsScreen.tsx      <- halaman utama (sudah ada, ganti isinya)
  ProductFormModal.tsx    <- komponen khusus fitur ini
  useProducts.ts          <- ambil/simpan data khusus fitur ini
```

File di `src/app/` cukup meneruskan ke fitur (sudah dibuat semua, tidak perlu diubah):
```tsx
export { default } from "@/features/products/ProductsScreen";
```

Halaman yang dipakai Kasir (landscape) **dan** Owner (portrait), misalnya Order, Stok, Pengeluaran, Member,
Laporan, Setting, harus enak dilihat di kedua orientasi. Cek lebar layar pakai `useWindowDimensions()`.

## 3. Bahan yang sudah tersedia

**Komponen** (`src/components/`)

| Komponen | Untuk |
|----------|-------|
| `AppText` | Semua teks (`variant="heading"` / `"muted"`) |
| `Button` | Tombol pill (`variant="action"` merah, `"brand"` biru, `"outline"`), ada `loading` |
| `TextField` | Input dengan label |
| `SearchInput` | Kolom cari |
| `Chip` | Pilihan kecil (kategori, filter) |
| `Card` | Kotak putih rounded |
| `AppModal` | Popup (form tambah/edit, konfirmasi) |
| `ScreenHeader` | Judul halaman + tombol kanan |
| `PeriodFilter` | Filter Hari Ini / Tanggal / Minggu / Bulan + ‹ › |
| `EmptyState` | Tampilan saat data kosong |
| `QueryState` | Tampilan loading / gagal memuat |
| `PinPad` | Tombol PIN |

**Fungsi bantu** (`src/lib/`)

| Fungsi | Untuk |
|--------|-------|
| `formatRupiah(15000)` | `"Rp15.000"` |
| `formatDate`, `formatTime`, `formatDateTime` | `"31 Okt 2026"`, `"14:05"` |
| `periodRange(period)` | `{ from, to }` untuk query per periode |
| `itemUnitPrice`, `ojolUnitPrice`, `calcOrderTotals` | Hitung harga (sama dengan database) |
| `pickImage({ square })`, `uploadImage(bucket, uri)` | Pilih foto dari galeri + upload |
| `errorMessage(error)` | Pesan error yang bisa dibaca kasir |

**Data** (`src/hooks/`): `useStoreSettings`, `useUpdateStoreSettings`, `useCategories`, `useMenuItems`.

**Label** (`src/constants/labels.ts`): `PAYMENT_METHOD_LABEL.cash` → `"Tunai"`, dan lainnya.

**Warna** (className): `brand` (biru), `action` (merah), `success` (hijau), `ink`, `ink-muted`, `panel`, `line`.

## 4. Contoh: halaman yang menampilkan data

```tsx
import { FlatList, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { EmptyState } from "@/components/EmptyState";
import { QueryState } from "@/components/QueryState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getSupabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryClient";
import type { Member } from "@/types/database";

function useMembers() {
  return useQuery({
    queryKey: queryKeys.members,
    queryFn: async () => {
      const { data, error } = await getSupabase().from("members").select("*").order("name");
      if (error) throw error;
      return data as Member[];
    },
  });
}

export default function MembersScreen() {
  const query = useMembers();

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Member" />
      {query.isLoading || query.error ? (
        <QueryState query={query} />
      ) : query.data!.length === 0 ? (
        <EmptyState icon={Users} title="Belum ada member" />
      ) : (
        <FlatList
          data={query.data}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <View className="border-b border-line px-5 py-4">
              <AppText variant="heading">{item.name}</AppText>
              <AppText variant="muted">{item.phone}</AppText>
            </View>
          )}
        />
      )}
    </View>
  );
}
```

## 5. Contoh: menyimpan data

```tsx
import { Alert } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { errorMessage } from "@/lib/errors";

function useAddMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; phone: string }) => {
      const { error } = await getSupabase().from("members").insert(input);
      if (error) throw error;
    },
    // daftar member otomatis ter-update setelah berhasil
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members }),
  });
}

// di dalam komponen:
const addMember = useAddMember();
addMember.mutate(
  { name, phone },
  {
    onSuccess: () => setOpen(false),
    onError: (e) => Alert.alert("Gagal menyimpan", errorMessage(e)),
  },
);
<Button title="Simpan" loading={addMember.isPending} onPress={...} />
```

## 6. Order & stok: WAJIB lewat fungsi database

App **tidak bisa** menulis langsung ke tabel `orders` atau mengubah `stock_qty`. Pakai fungsi ini:

```ts
// Buat order (Refie)
const { data: order, error } = await getSupabase().rpc("create_order", {
  p_order: { order_type: "takeaway", payment_method: "cash", discount_percent: 0, created_by_mode: "cashier" },
  p_items: [{ menu_item_id, qty: 2, unit_price: 18000, note: "less ice", options: [...] }],
});

// Batalkan order (Refie)
await getSupabase().rpc("cancel_order", { p_order_id: order.id, p_reason: "salah input" });

// Tambah stok / sesuaikan stok (Ridho)
await getSupabase().rpc("adjust_stock", { p_menu_item_id, p_mode: "add", p_qty: 10, p_note: "barang datang" });
await getSupabase().rpc("adjust_stock", { p_menu_item_id, p_mode: "adjust", p_qty: 7, p_note: "hitung ulang" });

// PIN (Fahri, di Setting)
await getSupabase().rpc("verify_owner_pin", { p_pin: "1234" });           // true / false
await getSupabase().rpc("change_owner_pin", { p_old_pin, p_new_pin });   // true / false
```

Mengaktifkan stok untuk menu baru (Ridho): `adjust_stock` dengan `p_mode: "adjust"` otomatis mengisi
`track_stock = true`. Mengeluarkan menu dari halaman Stok: update `track_stock = false`.

## 7. Laporan: query per periode (Fahri)

```ts
const { from, to } = periodRange(period);
const { data } = await getSupabase()
  .from("orders")
  .select("*, order_items(*)")
  .gte("business_date", from)
  .lte("business_date", to);
// omzet = jumlah (subtotal - discount_amount) dari order status "paid"
// laba  = omzet - jumlah (cost_price x qty) - pengeluaran (docs/05 bagian A)
```

Untuk data dummy laporan, jalankan `supabase/seed-orders.sql` di SQL Editor (project development saja).

## 8. Sebelum bikin Pull Request

```bash
npm run typecheck   # tidak boleh ada error
npm test            # unit test hitung harga
```
Lalu coba di tablet/HP dan lampirkan screenshot di PR. Panduan Git: [GIT-GUIDE.md](GIT-GUIDE.md).
