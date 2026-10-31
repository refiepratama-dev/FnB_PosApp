# 01 · PRD (Product Requirement Document)

## A. Gambaran produk
1. Nama aplikasi (sementara boleh)?
   Jawaban: **TemanPOS**
2. Jelaskan aplikasi ini dalam 1–2 kalimat.
   Jawaban: Aplikasi POS untuk UMKM, baik F&B maupun non-F&B, yang mengutamakan kecepatan, kemudahan, dan kenyamanan saat dipakai.
3. Masalah utama apa yang mau diselesaikan?
   Jawaban: Pencatatan masih manual, rekap lama.
4. Ini project untuk apa?
   - [x] Dipakai bisnis nyata: UMKM (F&B, kafe, petshop, usaha jasa, dan lainnya)
   - [x] Dijual sebagai produk (template)

## B. Target bisnis & pengguna
5. Jenis usaha yang ditargetkan:
   - [x] Semua jenis (generik): F&B, kafe, retail (contoh: petshop), dan jasa
6. Skala target (berapa outlet per pembeli, dan model jualnya):
   Jawaban: **1 project Supabase per bisnis** (single-tenant, di-setup satu per satu). Versi pertama fokus **F&B**, database disiapkan agar bisa generik nanti.
7. Sudah ada bisnis nyata yang jadi contoh/klien pertama? Ceritakan cara kerjanya sekarang.
   Jawaban:
8. Perkiraan jumlah transaksi per hari per outlet?
   - [ ] < 50   - [ ] 50–200   - [ ] 200–500   - [ ] > 500
9. Perkiraan jumlah item menu/produk?
   - [ ] < 30   - [ ] 30–100   - [ ] > 100

## C. Kompetitor & referensi
10. App POS yang jadi referensi atau pernah dipakai? Apa yang disukai/tidak disukai?
    Jawaban:
11. Apa pembeda app kamu dibanding mereka?
    Jawaban: (sementara) cepat, mudah, nyaman dipakai

## D. Scope
12. Fitur WAJIB di MVP:
    Jawaban: lihat "Info yang sudah ditetapkan" di bawah
13. Fitur yang nanti saja (fase 2/3)?
    Jawaban: Hubungi member via WhatsApp, multi-outlet (cabang)
14. Fitur yang pasti TIDAK dibuat?
    Jawaban:

## E. Monetisasi
15. Model bisnis:
    Jawaban: **Gratis**. Tiap bisnis punya Supabase sendiri, di-setup oleh tim TemanPOS. Fitur langganan/billing tidak dibuat dulu.
16. Perlu fitur lisensi/aktivasi di dalam app?
    Jawaban:

## F. Timeline & target
17. Deadline MVP? Ada milestone (presentasi, demo, sidang)?
    Jawaban:
18. Indikator sukses?
    Jawaban:
19. Bahasa aplikasi:
   - [ ] Indonesia  - [ ] Inggris  - [ ] Dua-duanya
20. Mata uang: hanya Rupiah?
    Jawaban:

---

## Ringkasan keputusan (detail di file terkait)

**Stack (07):** React Native + Expo, backend Supabase.

**Role (02):** 2 tampilan akses: **Owner** dan **Kasir**, dari **1 akun per toko** (email + password dibuat tim).
Login password cukup sekali per device. Setelah itu layar awal: "Masuk sebagai Owner" (PIN 4 digit) atau "Masuk sebagai Kasir" (tanpa PIN).

**Device (06):** tablet dan HP → 2 tampilan (Owner & Kasir), responsif.

**Menu Owner (03):** Navbar: Dashboard, Order, Laporan, Menu (kelola produk & harga), Setting (opsional).
Di Dashboard ada grid shortcut (gaya ikon GoFood/GoSend di app Gojek) untuk akses Stok, Pengeluaran, Member, dll. Owner bisa lihat & kelola semuanya.

**Menu Kasir (03), sidebar kiri:** Menu, Order, Pengeluaran, Stok, Report, Member, Setting.
- Member: nama + nomor HP. Belum bisa dihubungi via WA (fase berikutnya).

**Fitur (03):**
- Cetak struk printer Bluetooth & wired (USB)
- Pesanan dari provider ojol (GoFood, dll)
- Dine-in / takeaway, bisa input nomor meja

**Design (06):**
- Minimalis, modern, dominan putih dengan aksen **merah + biru** (palet sesuai gambar referensi)
- Sidebar, top bar, dan ringkasan order menempel tanpa gap (edge-to-edge)
- Tombol utama dibuat menonjol
- Referensi: screenshot app food delivery (kartu rounded, chip kategori, tombol pill tebal, banyak ruang putih)

**Tim (08):** 3 orang: Refie (author) + 2 contributor yang masih pemula → stack & struktur harus ramah pemula. Kerja per branch.
