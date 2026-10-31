# 02 · User & Role

> Diisi dari hasil diskusi. Bagian bertanda **(usulan)** tinggal dicek: setuju atau diubah.

## A. Role
1. Role yang ada:
   - [x] **Owner** (pemilik usaha): kelola semua, monitoring order realtime
   - [x] **Kasir**: transaksi harian, tanpa akun pribadi
   - [ ] Super Admin (pemilik TemanPOS): **belum dibuat di app**. Untuk sementara, tim developer memantau lewat dashboard Supabase.
2. Satu orang boleh punya lebih dari satu role?
   Jawaban: Owner bisa masuk ke mode Kasir juga.
3. Outlet:
   Jawaban: **MVP: 1 outlet saja.** Multi-outlet ditunda ke fase 2 (database tetap disiapkan kolom outlet supaya mudah ditambah). Rencana fase 2: Owner bisa punya **1 atau lebih outlet** (misal 2). Semua outlet milik owner yang sama ada di 1 project Supabase. Di tampilan Owner bisa memantau tiap outlet (pilih outlet) atau gabungan semua. Kalau cuma 1 outlet, pilihan outlet tidak ditampilkan. Tiap device kasir terhubung ke 1 outlet.

## B. Jumlah user
4. Per bisnis: 1 akun Owner. Kasir tidak punya akun (mode kasir di device).
5. Perkiraan total bisnis di tahun pertama?
   Jawaban:
6. Device dipakai bersamaan per bisnis: beberapa device kasir + HP owner untuk monitoring. Data tersinkron realtime (Supabase Realtime).

## C. Login & akun

### Owner
- Daftar & login **pertama kali**: username/email + password.
- Setelah itu, cukup **PIN** (seperti m-banking). Tidak perlu login ulang.
- Lupa PIN → login ulang pakai password, lalu buat PIN baru.
- Owner bisa login di beberapa device (HP pribadi + tablet kasir).

### Kasir
- Device kasir **dihubungkan sekali** oleh Owner (Owner login di device itu).
- Setelah terhubung, layar awal punya 2 tombol:
  - **Masuk sebagai Owner** → minta PIN Owner
  - **Masuk sebagai Kasir** → langsung masuk, tanpa password
- **1 akun per toko** (email + password dibuat tim), dengan 2 tampilan akses: Owner & Kasir.
- Kasir tampil sebagai "Kasir". Owner tampil dengan **nama toko**.
- **Tidak ada buka/tutup shift.** Kasir langsung bisa transaksi.
- Bagian bawah sidebar kasir: tombol **Keluar** (kembali ke layar awal) dan **Masuk sebagai Owner** (pakai PIN).
- Owner keluar: tombol **Keluar** kembali ke layar awal (masuk lagi pakai PIN). **Logout akun** penuh ada di Setting (setelah itu harus login pakai password lagi). ✅ disetujui

### Backend per bisnis
- Tiap bisnis punya **project Supabase sendiri**, di-setup oleh tim TemanPOS.
- Tidak ada fitur langganan di app (gratis).
- Akun Supabase: dikelola tim TemanPOS. Pakai paket Free selama memungkinkan, upgrade ke paket berbayar kalau dana sudah cukup.
- Cara app terhubung ke Supabase milik bisnis: **1 APK untuk semua toko**, pertama kali dibuka scan QR / input kode toko.

## D. Hak akses (usulan)
✅ boleh · ❌ tidak · 🔒 butuh PIN Owner

| Aksi | Owner | Kasir |
|------|-------|-------|
| Lihat laporan/report lengkap | ✅ | ✅ |
| Monitoring order realtime | ✅ | ✅ (order di device-nya) |
| Kelola menu & harga (lewat Setting) | ✅ | 🔒 |
| Tandai menu habis / tersedia | ✅ | ✅ |
| Buat transaksi | ✅ | ✅ |
| Diskon per transaksi (persen) | ✅ | ✅ |
| Batalkan item (void) setelah dikirim | ✅ | 🔒 |
| Batalkan order (koreksi salah input) | ✅ | ✅ |
| Catat pengeluaran | ✅ | ✅ |
| Kelola stok (tambah / sesuaikan) | ✅ | ✅ |
| Kelola member (tambah nama + HP) | ✅ | ✅ |
| Hapus member | ✅ | 🔒 |
| Setting printer | ✅ | ✅ |
| Setting usaha (pajak, struk, dll) | ✅ | ✅ |
| Cetak ulang struk | ✅ | ✅ |
| Ubah PIN, lihat QR toko | ✅ | 🔒 |
| Ubah password / profil toko | tim TemanPOS | tim TemanPOS |
| Logout akun (putuskan device) | ✅ | ✅ |

12. Log aktivitas untuk void/batal/diskon (siapa, kapan, alasan): **ya (usulan)**

## Catatan tambahan
