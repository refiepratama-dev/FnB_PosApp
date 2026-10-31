# 04 · Alur Kerja (Flow)

> Draf disusun dari keputusan di file 01–03. Bagian bertanda **(usulan)** tinggal dicek: setuju atau diubah.

## A. Setup toko baru (dikerjakan tim TemanPOS)
1. Buat project Supabase baru untuk toko → jalankan migration (semua tabel & aturan akses dibuat otomatis).
2. Buat **1 akun per toko** (email + password), dibuat tim sesuai nama toko & password yang disepakati. Owner tidak daftar sendiri. Satu akun ini dipakai untuk 2 akses: Owner dan Kasir.
3. Isi data toko: nama toko, alamat, logo, no. HP (diisi tim saat setup).
4. App menghasilkan **QR koneksi toko** → diberikan ke owner bersama akun loginnya.

## B. Pertama kali membuka app di sebuah device
1. Layar **Hubungkan ke Toko** → scan QR (atau ketik kode toko).
2. Layar **Login** → email + password toko.
3. Masuk ke **Layar Awal**.

PIN owner (4 digit) **satu untuk semua device**, PIN awal **0000** (di-set tim). Ganti PIN lewat Setting → berlaku di semua device.

Scan QR & login password cukup **sekali per device**.

## C. Layar Awal
Saat app dibuka, app **langsung masuk ke mode terakhir** (Owner atau Kasir) tanpa PIN. Layar Awal tampil hanya setelah tombol **Keluar** ditekan, atau saat pertama kali setelah login.
- Logo & nama toko
- Tombol **Masuk sebagai Owner** → masukkan PIN → mode Owner (portrait)
- Tombol **Masuk sebagai Kasir** → langsung mode Kasir (landscape)
- Link **Lupa PIN?** → login ulang pakai password toko → buat PIN baru (berlaku di semua device)

## D. Order: Takeaway
1. Halaman **Menu** kasir → di ringkasan order pilih tipe **Takeaway**.
2. Tap menu:
   - Ada varian/topping → popup: pilih varian, topping, catatan, jumlah → **Tambah**
   - Tidak ada → langsung masuk keranjang (tap lagi = jumlah +1)
3. Di ringkasan: ubah jumlah, hapus item, nama pelanggan (opsional), pilih member (opsional), diskon % (opsional).
4. Tekan **Bayar** → pilih metode: Tunai / QRIS / Transfer / Debit → **Lunas**.
5. Order tersimpan → 🔔 cekring (kasir & HP owner) → stok berkurang → struk tercetak.
6. Layar **Order Selesai** (centang + teks) → tombol **Order Baru** → kembali ke Menu, keranjang kosong.

## E. Order: Dine-in
Sama seperti takeaway, ditambah:
- Pilih tipe **Dine-in** → isi **nomor meja (wajib)**.
- Tetap **langsung bayar**. Tambah pesanan = buat order baru.

## F. Order: Ojol
1. Pilih tipe **Ojol** → pilih provider: GoFood / GrabFood / ShopeeFood.
2. Semua harga di grid & keranjang otomatis berubah ke **harga ojol** (persen provider, dibulatkan ke atas Rp500).
3. Isi nomor order ojol (opsional), pilih menu.
4. Tekan **Simpan** → pilih uang masuk: **Tunai dari driver** / **Saldo merchant** → tersimpan sebagai Lunas.
5. Cekring → stok berkurang → struk tercetak (untuk driver) → Order Selesai.

Kalau kasir ganti tipe dari Ojol ke tipe lain (atau sebaliknya) saat keranjang sudah terisi, harga di keranjang ikut dihitung ulang.

## G. Menu habis
- Menu dengan stok 0 tampil **abu-abu + label "Habis"**, tidak bisa ditap.
- Jumlah di keranjang tidak bisa melebihi sisa stok.

## H. Batalkan order
Halaman **Order** → pilih order → **Batalkan** → konfirmasi (+ alasan opsional **(usulan)**) → status **Dibatalkan**.
- Stok dikembalikan
- Tidak dihitung di omzet, tetap tampil di daftar order & laporan (jumlah order dibatalkan)

## I. Member
- Saat order: tombol **Member** di ringkasan → cari nama/no HP → pilih, atau **+ Member Baru** (nama + no HP).
- Halaman **Member**: daftar member + search, tambah/edit, detail berisi ringkasan (total belanja, jumlah transaksi, terakhir belanja).

## J. Pengeluaran
Halaman **Pengeluaran** → **+ Tambah** → keterangan, nominal, metode (Tunai/Transfer), foto nota (opsional) → Simpan.
Daftar pengeluaran per periode (filter sama dengan laporan), bisa edit & hapus.

## K. Stok
1. Halaman **Stok** → **+ Tambah menu ke stok** → pilih menu satuan → isi jumlah awal.
2. Barang datang → tap item → **Tambah stok** (+jumlah).
3. Hitung ulang fisik → tap item → **Sesuaikan** (isi jumlah sebenarnya).
4. Item bisa dikeluarkan dari halaman Stok → menu kembali "selalu tersedia".

## L. Owner
- **Dashboard**: ringkasan hari ini (omzet, jumlah order, laba), daftar order masuk realtime + cekring, grid shortcut (Stok, Pengeluaran, Member, dll).
- **Order**: daftar semua order + filter periode, detail order, cetak ulang struk, batalkan.
- **Laporan**: filter Hari Ini / Tanggal / Minggu / Bulan + tombol ‹ ›, kartu angka & grafik.
- **Menu**: kelola kategori, item, varian, topping, harga, HPP, foto.
- **Setting**: pajak & service, persen ojol, printer, footer struk, ubah PIN, QR toko, logout. (Profil toko & password diatur tim, tidak ada di app.)

## M. Keluar
- **Kasir**: sidebar bawah → **Keluar** (ke Layar Awal) atau **Masuk sebagai Owner** (PIN).
- **Owner**: **Keluar** → Layar Awal (masuk lagi pakai PIN).
- **Logout akun** (owner & kasir, di Setting) → device terputus → harus login password owner lagi.

## N. Kasus khusus
- **Printer error / belum terhubung**: order tetap tersimpan, muncul pesan "Struk gagal dicetak", cetak ulang dari halaman Order.
- **Internet mati**: online only. Banner merah "Tidak ada internet", tombol Bayar/Simpan dikunci sampai online lagi.
- **Dua device order bersamaan untuk stok terakhir**: order yang tersimpan lebih dulu yang berhasil, device lain dapat pesan "Stok tidak cukup" **(usulan)**.

## O. Daftar layar

**Umum (orientasi bebas):** Hubungkan ke Toko, Login, Layar Awal, Masukkan PIN, Lupa PIN.

**Kasir (landscape, sidebar kiri):**
| Sidebar | Isi |
|---------|-----|
| Menu | Grid menu + kategori + search, ringkasan order di kanan, popup varian/topping, popup bayar, layar Order Selesai |
| Order | Riwayat order + detail, cetak ulang, batalkan |
| Pengeluaran | Daftar + form tambah/edit |
| Stok | Daftar stok + tambah/sesuaikan |
| Report | Sama dengan laporan owner |
| Member | Daftar + form + ringkasan |
| Setting | Sama dengan owner; Kelola Produk, Ubah PIN & QR toko minta PIN owner |
| *(bawah)* | Keluar · Masuk sebagai Owner |

**Owner (portrait, navbar bawah):** Dashboard (+ grid shortcut ke Stok, Pengeluaran, Member), Order, Laporan, Menu, Setting.
