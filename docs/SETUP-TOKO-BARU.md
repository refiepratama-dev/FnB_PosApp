# Setup Toko Baru

Panduan untuk developer setiap ada toko baru yang mau memakai TemanPOS.
Prinsipnya: **1 toko = 1 project Supabase**. APK-nya sama untuk semua toko,
toko dibedakan lewat **QR toko** yang di-scan saat pertama kali membuka aplikasi.

Waktu: ±15 menit.

---

## 1. Buat project Supabase

1. Login ke [supabase.com](https://supabase.com) → **New project**.
2. Nama: `temanpos-<nama-toko>` (contoh: `temanpos-baksopakkumis`).
3. Database password: buat yang kuat, simpan di tempat aman (password manager).
4. Region: **Southeast Asia (Singapore)**.
5. Tunggu sampai project selesai dibuat (1–2 menit).

> Paket gratis: 1 akun Supabase maksimal 2 project aktif, dan project yang tidak
> dipakai 1 minggu akan di-pause. Untuk toko berikutnya bisa pakai akun Supabase
> baru (misalnya pakai email toko), atau upgrade ke Pro.

## 2. Jalankan migration

Buka **SQL Editor** → **New query**, lalu jalankan **semua** file di
`supabase/migrations/` **satu per satu, urut dari tanggal paling lama**:

1. `20261031000000_init.sql`
2. `20261101000000_realtime_menu.sql`
3. `20261102000000_realtime_expenses.sql`
4. (file migration baru lainnya, kalau ada)

Setiap file: salin semua isinya → tempel → **Run** → pastikan muncul *Success*.

> Jangan jalankan `seed.sql` / `seed-orders.sql`. Itu data contoh Di`Sako,
> toko baru mengisi menunya sendiri.

## 3. Buat akun owner

1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. Isi email & password owner, centang **Auto Confirm User**.
3. Catat email & password-nya untuk diberikan ke pemilik toko.

PIN owner awal: **0000** (owner wajib menggantinya lewat Setting → Ubah PIN).

## 4. Buat QR toko

1. Buka **Project Settings** → **API**. Salin:
   - **Project URL** (contoh `https://abcdxyz.supabase.co`)
   - **anon / publishable key**
   - ⚠️ **JANGAN** pakai `service_role` / secret key.
2. Di folder project, jalankan:
   ```
   npm run qr-toko
   ```
3. Isi nama toko, Project URL, dan anon key. Script akan mengecek koneksi dan
   memastikan migration sudah dijalankan.
4. Hasilnya ada di folder `qr-toko/<nama-toko>/`:
   - `qr.png`: gambar QR untuk dikirim ke pemilik toko
   - `qr.svg`: versi tajam untuk dicetak
   - `kode.txt`: kode manual (cadangan kalau kamera bermasalah)

Folder `qr-toko/` sudah masuk `.gitignore`. **Jangan di-commit.**

## 5. Serahkan ke pemilik toko

Kirim lewat chat pribadi (bukan grup umum):

- File APK TemanPOS
- `qr.png` (atau isi `kode.txt`)
- Email & password owner

## 6. Pemilik toko memasang aplikasi

1. Install APK di tablet kasir.
2. Buka aplikasi → **Scan QR** → arahkan ke QR toko.
3. Login dengan email & password owner.
4. Ganti PIN (Setting → Ubah PIN), isi nama toko, lalu tambah menu
   (Setting → Kelola Produk).
5. Untuk device tambahan (misal HP owner): buka **Setting → QR Toko** di device
   yang sudah tersambung, lalu scan dari device baru.

---

## Checklist cepat

- [ ] Project Supabase dibuat (region Singapore)
- [ ] Semua migration dijalankan berurutan
- [ ] Akun owner dibuat (Auto Confirm)
- [ ] `npm run qr-toko` → QR & kode jadi
- [ ] APK + QR + akun dikirim ke pemilik lewat chat pribadi
- [ ] Pemilik berhasil scan, login, dan ganti PIN
