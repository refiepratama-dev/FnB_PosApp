# 09 · Keamanan, Kualitas, Rilis & Maintenance

> Diisi dengan default yang mengutamakan "cepat jadi". Bagian **(usulan)** tinggal dicek.

## A. Keamanan
- Data hanya bisa diakses setelah login akun toko (RLS Supabase)
- Mode Owner dilindungi PIN 4 digit (1 PIN untuk semua device)
- `.env` & `service_role` key tidak pernah di-commit (repo public)
- App **ingat mode terakhir**: dibuka lagi langsung masuk ke mode terakhir (Owner/Kasir) tanpa PIN. Tidak ada auto-kunci. Owner dibiasakan tekan **Keluar** sebelum menyerahkan tablet ke kasir.

## B. Performa
- Harus lancar di tablet Android kelas menengah ke bawah
- Simpan transaksi sampai Order Selesai tampil: target < 2 detik (dengan internet normal)
- Grid menu memakai daftar yang efisien supaya tetap lancar walau menu > 100 item

## C. Backup
- Setahuku paket Free Supabase **tidak menyediakan backup otomatis** yang bisa dipulihkan, jadi tim yang melakukan backup:
  - **MVP:** backup manual **seminggu sekali** per toko + **wajib backup sebelum menjalankan migration/update database**. Simpan **4 salinan terakhir** (sekitar 1 bulan), di tempat privat (Google Drive tim), **bukan di repo public**.
  - **Setelah toko bertambah:** backup otomatis **harian** pakai GitHub Actions terjadwal di **repo private terpisah** (bukan repo app yang public)
  - Kalau sudah upgrade ke paket berbayar, backup harian dari Supabase bisa dipakai
- Data tersimpan di cloud, jadi tablet rusak/hilang tidak menghilangkan data

Unit test perhitungan harga, update OTA, dan tanpa lisensi: ✅ disetujui.

## D. Testing
- **Testing manual** oleh tim di tablet Android + HP sebelum tiap PR di-merge
- **Unit test sederhana** hanya untuk perhitungan harga (subtotal, diskon, service, pajak, harga ojol + pembulatan), karena salah hitung uang paling berbahaya **(usulan)**
- **Seed data dummy** (kategori, menu contoh, beberapa order) supaya semua anggota bisa langsung testing
- Uji coba di toko nyata sebelum dipakai penuh

## E. Rilis
- Distribusi: **APK langsung** (build via EAS Build)
- Versi: `1.0.0`, `1.1.0`, dst + catatan perubahan singkat di GitHub Releases
- **EAS Update (update OTA)**: perbaikan kecil (tampilan, bug logika) bisa dikirim tanpa install ulang APK. Perubahan native (printer, library baru) tetap perlu APK baru **(usulan)**

## F. Dokumentasi
- `README.md`: cara setup project untuk tim
- `docs/GIT-GUIDE.md`: panduan Git untuk pemula
- `docs/SETUP-TOKO.md`: langkah setup toko baru (buat project Supabase, migration, akun, QR)
- `docs/` berisi semua dokumen requirement ini
- Panduan pengguna (owner & kasir): menyusul setelah MVP

## G. Legal
- Kebijakan privasi: belum perlu (tidak rilis di Play Store)
- Lisensi: tanpa lisensi open-source (semua hak dilindungi). Orang lain bisa melihat kode di repo public, tapi tidak berhak memakainya **(usulan)**

## H. Maintenance
- Bug & support: tim TemanPOS
- Owner melapor masalah lewat WhatsApp ke tim
