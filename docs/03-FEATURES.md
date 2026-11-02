# 03 · Detail Fitur per Modul

Tandai prioritas tiap modul: **MVP** / **Fase 2** / **Tidak perlu**.

## 1. Menu & Produk (prioritas: MVP) ✅
Dikelola oleh Owner. Kasir hanya bisa menandai tersedia/habis.
- Struktur: **Kategori → Item** (tanpa sub-kategori)
- Data item: nama, harga, kategori, **foto menu (opsional)**, status tersedia/habis. Tanpa foto → kotak warna + inisial nama menu.
- Foto diupload **dari galeri saja** (tanpa kamera). App otomatis memotong **persegi 1:1**, mengecilkan ke **800×800 px**, dan mengompres ke JPEG (hasil sekitar 100–300 KB). Foto asli maksimal **10 MB**; lebih dari itu ditolak dengan pesan.
- **Harga modal (HPP)** opsional per item → untuk laba kotor di laporan
- **Varian** dengan harga berbeda (Regular/Large, Panas/Dingin)
- **Topping/add-on** (extra shot, level pedas, tanpa es), bisa diatur wajib atau opsional
- **Harga ojol: persentase per provider** (misal GoFood +20%, Grab +25%, Shopee +x%), diatur owner di Setting. Dihitung otomatis untuk semua menu saat kasir pilih tipe Ojol. Hasilnya **dibulatkan ke atas ke kelipatan Rp500** (contoh: Rp16.875 → Rp17.000).
- Paket/combo → **fase 2**
- Harga per outlet → fase 2 (ikut multi-outlet)
- Menu per jam/hari tertentu, import Excel → belum dibahas (default: fase 2)

## 2. Transaksi / Order (prioritas: MVP) ✅
- Tipe pesanan: **Dine-in, Takeaway, Ojol** (GoFood / GrabFood / ShopeeFood)
- Dine-in: input **nomor meja** (ketik nomor, tanpa denah meja)
- Ojol: pilih provider + **nomor order ojol** (opsional)
- Cari menu: **grid per kategori + kolom search**
- **Catatan** per item
- **Nama pelanggan** opsional
- **Semua order wajib langsung bayar** (dine-in, takeaway, ojol). Tidak ada open bill.
- Tambah pesanan = **buat order baru**. Tiap order dihitung terpisah, walaupun pembelinya orang yang sama.
- Split bill → **fase 2**

## 3. Pembayaran (prioritas: MVP) ✅
- Metode: **Tunai, QRIS, Transfer, Debit/Kartu**, semuanya **dicatat manual**
- Alur bayar: pilih metode → tekan tombol **Lunas**. Tidak ada input nominal uang diterima / hitung kembalian.
- QRIS pakai QR statis toko (di luar app)
- Pesanan ojol: metode bayar "Ojol – GoFood/Grab/Shopee", lalu kasir pilih uang masuk lewat **"Tunai dari driver"** atau **"Saldo merchant"**
- **Batalkan order** yang sudah lunas (koreksi salah input): kasir & owner bisa, **tanpa PIN**. Status jadi Dibatalkan, tidak dihitung di omzet, data tetap tersimpan.
- QRIS otomatis (payment gateway), bayar campur beberapa metode → **fase 2**
- **Refund: tidak ada**

## 4. Struk (prioritas: MVP, dikerjakan setelah pindah ke development build) ✅
- Printer thermal **Bluetooth & USB** (USB hanya Android), kertas **58mm & 80mm** (pilih di Setting)
- Isi struk: logo, nama & alamat toko, nomor struk, tanggal & jam, tipe pesanan, nomor meja, item, subtotal, pajak, total, metode bayar, footer bisa diubah
- **1 template struk saja** (tidak ada tiket dapur terpisah). Kasir bacakan pesanan atau berikan struk ke dapur.
- **Cetak ulang** struk dari halaman Order (riwayat)
- Cetak berjalan **otomatis** setelah Lunas, tanpa pilihan otomatis/manual di Setting
- Setelah Lunas muncul layar **Order Selesai**: ikon centang di atas, teks di bawahnya, satu tombol **Order Baru** (kembali ke halaman menu, keranjang kosong)
- Struk digital, laci kas otomatis → **fase 2**
- Merek printer untuk testing: (belum dijawab)

## Suara
- Setiap **order dibuat**, bunyi **"cekring"** (suara mesin kasir) di device kasir **dan di HP owner** (realtime)

## 5. Meja ✅
- Hanya input **nomor meja** saat dine-in. Tidak ada denah, status meja, atau reservasi.

## 6. Dapur / KDS: TIDAK DIBUAT ✅

## 7. Shift & Kas: TIDAK DIPAKAI ✅
Tidak ada buka/tutup shift, modal awal, atau hitung selisih kas.

## 8. Stok (prioritas: MVP)
- Tujuan: **hanya memantau menu mana yang masih ada dan yang habis**
- Tidak ada peringatan stok menipis
- Tidak ada bahan baku, resep, supplier (tidak direncanakan)
- Di halaman Stok, kasir/owner **memilih menu mana yang dihitung stoknya** (menu satuan, misal kue, minuman botol). Menu lain (racikan seperti kopi, nasi goreng) tidak masuk halaman Stok dan **selalu tersedia**.
- Menu yang dihitung **pakai angka jumlah stok**
- Stok berkurang otomatis saat order lunas, kembali saat order dibatalkan
- Stok 0 → menu otomatis "Habis" dan tidak bisa dipilih
- Kasir & owner bisa tambah stok dan sesuaikan jumlah

## 9. Member (prioritas: MVP) ✅
- Data: **nama + nomor HP** (nomor HP unik), tanggal daftar
- Saat order, kasir bisa cari/tambah member (opsional)
- Detail member hanya menampilkan **ringkasan** (misal total belanja, jumlah transaksi). Tidak ada daftar riwayat order.
- Poin/diskon member, hubungi via WA → **fase 2**

## 10. Diskon & Pajak (prioritas: MVP) ✅
- **Diskon per transaksi, dalam persen**, diinput kasir di ringkasan order
- Diskon per item, promo otomatis, voucher → **fase 2**
- **Pajak (PB1)** & **service charge**: on/off + persen di Setting, default **mati**
- Harga menu belum termasuk pajak. Urutan: subtotal − diskon → + service → + pajak

## 11. Laporan & Dashboard (prioritas: MVP) ✅
Laporan owner dan report kasir **sama isinya**.

**Filter (seperti app laundry):** tab **Hari Ini / Tanggal / Minggu / Bulan**. Di bawahnya label periode di tengah, diapit tombol **‹** dan **›** untuk pindah periode. Tab Tanggal membuka kalender untuk pilih tanggal tertentu.

Kasir boleh melihat laba & harga modal.

**Tampilan (keputusan desain):**
- **Kartu angka (KPI):** Omzet, Jumlah Transaksi, Rata-rata per Transaksi, Laba Sederhana, Total Pengeluaran, Order Dibatalkan
- **Grafik batang:** penjualan per hari (mingguan/bulanan) atau per jam (harian)
- **Grafik batang per jam:** jam ramai
- **Daftar ranking dengan bar:** menu terlaris (top 5–10)
- **Bar persentase:** per metode bayar, per tipe pesanan (dine-in/takeaway/tiap provider ojol)

- Export Excel/PDF: **tidak ada**

**Dashboard owner:** ringkasan hari ini (omzet, jumlah order, laba), order masuk realtime + cekring, grid shortcut (Stok, Pengeluaran, Member, dll)

## 12. Pengeluaran (prioritas: MVP) ✅
- Data: tanggal (otomatis), keterangan, nominal, metode (Tunai/Transfer), foto nota (opsional). **Tanpa kategori.**
- Kasir & owner bisa **tambah, edit, hapus**
- Laporan owner menampilkan **laba sederhana** = omzet − modal (HPP) − pengeluaran

## 13. Self-order: TIDAK DIBUAT ✅
- Tidak ada scan QR di meja / pelanggan pesan sendiri
- Pesanan ojol dicatat manual oleh kasir (tanpa integrasi API)

## 14. Notifikasi (prioritas: setelah inti) ✅
- Push notification **order baru** ke HP owner dengan suara cekring (perlu development build)
- Saat app terbuka: cekring lewat Realtime
- Notifikasi lain (stok menipis, laporan harian): tidak ada

## 15. Setting (prioritas: MVP) ✅
- **Owner:** pajak & service, persen harga ojol, printer, footer struk, ubah PIN, QR koneksi toko, logout akun
- **Kasir:** menu Setting **sama persis** dengan owner. Menu yang butuh izin owner (**Kelola Produk/Menu**, **Ubah PIN**, **QR toko**) tetap tampil, tapi saat ditap **diminta PIN owner** dulu. Kasir bisa logout akun (setelah itu device harus login lagi).
- Ubah PIN (dari mode mana pun): masukkan PIN lama → PIN baru → konfirmasi.
- Profil toko (nama, alamat, logo, no. HP) dan password **diatur tim saat setup**, tidak ada di app.

## Catatan tambahan / fitur lain yang belum ada di daftar
