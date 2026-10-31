# 05 · Aturan Bisnis & Data

> Draf disusun dari keputusan di file 01–04. Bagian bertanda **(usulan)** tinggal dicek.

## A. Perhitungan harga

### Harga per item
`harga item = harga dasar (atau harga varian) + harga topping yang dipilih`
`total item = harga item × jumlah`

### Harga ojol
`harga ojol per item = harga item × (1 + persen provider)`, lalu **dibulatkan ke atas ke kelipatan Rp500**.
Contoh: Rp13.500 × 1,25 = Rp16.875 → **Rp17.000**.
Pembulatan dilakukan **per item (harga satuan)** sebelum dikali jumlah **(usulan)**.

### Total order (urutan)
1. **Subtotal** = jumlah semua total item
2. **Diskon** = subtotal × persen diskon (0–100%)
3. **Service** = (subtotal − diskon) × persen service *(kalau aktif)*
4. **Pajak** = (subtotal − diskon + service) × persen pajak *(kalau aktif)*
5. **Total** = subtotal − diskon + service + pajak

Total akhir **tidak dibulatkan** **(usulan)**. Semua angka rupiah dibulatkan ke rupiah terdekat (tanpa sen).

### Laporan
- **Omzet** = jumlah (subtotal − diskon) dari order Lunas. Pajak & service tidak masuk omzet **(usulan)**.
- **Modal (HPP)** = jumlah HPP item terjual (item tanpa HPP dihitung 0).
- **Laba sederhana** = omzet − HPP − pengeluaran.
- Order **Dibatalkan** tidak dihitung di semua angka di atas, hanya di "Order Dibatalkan".
- Komisi ojol tidak dihitung app (sudah dianggap tertutup oleh persen kenaikan harga ojol).

## B. Penomoran
- Nomor order: **`TP-YYMMDD-001`**, urutan **reset tiap hari** (contoh: `TP-261031-001`) **(usulan)**.
- Nomor tampil besar di struk dan di layar Order Selesai.

## C. Waktu
- Zona waktu toko: **WIB** default, bisa diganti di Setting (WIB/WITA/WIT) **(usulan)**.
- Hari bisnis berganti pukul **00:00** **(usulan)**. Order jam 00.30 masuk ke hari berikutnya.

## D. Integritas data
- Order yang sudah Lunas **tidak bisa diedit**, hanya bisa **dibatalkan**.
- Saat order dibuat, **nama menu, harga, harga varian/topping, dan HPP disalin ke order**. Perubahan harga menu nanti tidak mengubah order lama.
- Menu/kategori yang dihapus diarsipkan (soft delete), supaya order lama tetap menampilkan namanya.
- Member dan pengeluaran yang dihapus: dihapus permanen **(usulan)**. Order yang terhubung ke member tetap ada, nama member tersalin di order.
- Stok tidak boleh minus.

## E. Validasi
- Nomor HP member: angka saja, diawali `08` atau `62`, 10–14 digit, **unik**.
- Nama member: wajib. Nomor meja: wajib untuk dine-in.
- Diskon: 0–100%. Persen pajak/service/ojol: 0–100%.
- Harga & nominal pengeluaran: lebih dari 0.

## F. Format tampilan
- Uang: **Rp15.000** (titik sebagai pemisah ribuan, tanpa desimal)
- Tanggal: **31 Okt 2026**, jam: **14:05** (24 jam)
- Bahasa app: Indonesia **(usulan)**

## G. Data & privasi
- Data pelanggan yang disimpan hanya nama + nomor HP member.
- Data transaksi disimpan selamanya (selama kuota Supabase cukup).
- Data awal (menu nyata toko) diinput owner lewat app, atau dimasukkan tim saat setup.

## H. Akun & akses ✅
- **1 akun per toko** (email + password), dibuat tim. Password tidak bisa diubah dari app.
- Akun itu punya **2 tampilan akses**: Owner (pakai PIN 4 digit) dan Kasir (tanpa PIN).
- Menu Setting sama untuk kedua tampilan. Di mode kasir, menu khusus owner (Kelola Produk, Ubah PIN, QR toko) minta PIN owner saat dibuka.
- Nama yang tampil di mode Owner = **nama toko**.

## I. Entitas data (MVP)
| Tabel | Isi |
|-------|-----|
| `store_settings` | Profil toko (nama, alamat, logo, no. HP: diisi tim), pajak, service, persen ojol per provider, footer struk, ukuran kertas, zona waktu, **PIN owner (hash, awal 0000)** |
| `categories` | Kategori menu |
| `menu_items` | Nama, harga, HPP, foto, kategori, `track_stock`, `stock_qty`, status arsip |
| `variant_groups`, `variants` | Grup varian (Ukuran, Suhu) + pilihan & harganya |
| `addon_groups`, `addons` | Grup topping (wajib/opsional, maks pilihan) + pilihan & harganya |
| `members` | Nama, no HP |
| `orders` | Nomor, tipe (dine-in/takeaway/ojol), provider ojol, no order ojol, no meja, nama pelanggan, member, subtotal, diskon %, service, pajak, total, metode bayar, sumber uang ojol, status (Lunas/Dibatalkan), alasan batal, waktu |
| `order_items` | Salinan nama, harga, HPP, varian, jumlah, catatan |
| `order_item_addons` | Salinan topping per item |
| `expenses` | Keterangan, nominal, metode, foto nota, tanggal |
| `stock_movements` | Riwayat stok: tambah, sesuaikan, terjual, kembali (batal) |

Disiapkan untuk fase 2 (belum dipakai): kolom `outlet_id` agar multi-outlet mudah ditambah.
