# 08 · Kerja Tim & Git Workflow ✅

## A. Anggota
| Nama | GitHub | Peran |
|------|--------|-------|
| Refie | refiepratama-dev | Author / Owner repo, reviewer & satu-satunya yang merge |
| Ridho | Oxura2727 | Contributor |
| Fahri | (menyusul) | Contributor |

Ridho & Fahri masih pemula → struktur project, panduan, dan pembagian tugas dibuat sejelas mungkin.

## B. Repository
- Repo: `refiepratama-dev/FnB_PosApp`
- Visibilitas: **public**. Semua orang bisa melihat kode, tapi hanya Refie + collaborator yang bisa push. Orang luar hanya bisa fork/ajukan PR, dan tidak ada yang masuk tanpa di-merge Refie.
- Karena public: **jangan pernah commit `.env`** atau key rahasia (terutama `service_role` key Supabase)
- Ridho & Fahri diundang sebagai **collaborator** (bukan fork)
- Isi repo: app Expo + `supabase/` (migration) + `docs/` (dokumen requirement ini)

## C. Branch & merge
- `main` **diproteksi**, tidak ada push langsung
- Branch per fitur: `feat/nama-fitur`, perbaikan: `fix/nama-bug`
- Alur: branch → commit → push → **Pull Request** → review Refie → **squash merge** ke `main`
- Format commit: `feat:`, `fix:`, `style:`, `docs:`, `chore:`
- Kode & nama variabel bahasa Inggris; commit, PR, komentar boleh bahasa Indonesia

## D. Tugas
- Task board: **GitHub Projects + Issues** (1 fitur = 1 issue + penanggung jawab)
- **Template PR** dengan checklist (sudah dites di device, screenshot)
- Panduan Git untuk pemula: `docs/GIT-GUIDE.md`

## E. Pembagian tugas
**Tahap 1 — Refie (fondasi):** setup project, tema & font, navigasi kasir/owner, database & migration, scan QR, login, PIN.
Selama tahap 1, Ridho & Fahri mempelajari panduan Git dan struktur project.

**Tahap 2 — paralel:**
| Orang | Modul |
|-------|-------|
| Refie | Halaman Menu kasir, keranjang, pembayaran, halaman Order |
| Ridho / Fahri | Kelola Produk (kategori, item, varian, topping), Stok, Member |
| Fahri / Ridho | Pengeluaran, Laporan/Report, Dashboard owner, Setting |

**Tahap 3 — Refie:** printer, push notification cekring, build APK.

## F. Supabase & rahasia
- Project development dipindah ke akun **temanpos3@gmail.com** (project ref `syusaqlxejghwtgcjfmh`), karena kuota project gratis akun lain sudah penuh. Project lama di eu-west-1 dihapus/tidak dipakai.
- Organisasi Supabase: **Teman POS** (Free). Project **Di'Sako Steak** (toko pertama) dipakai **sebagai project development dulu**; sebelum toko mulai dipakai sungguhan, database **dibersihkan dan dijalankan ulang dari migration**
- Region: **Southeast Asia (Singapore)** ✅
- Anggota tim diundang ke organisasi (atau memakai akun temanpos3 bersama). Password akun **tidak pernah ditulis di repo**
- Perubahan struktur database **hanya lewat Refie** (migration)
- `.env.example` di repo; key asli dibagikan lewat chat pribadi; `.env` tidak boleh di-commit

## G. Kerapian kode
- ESLint + Prettier (format otomatis saat simpan)
- GitHub Actions: cek lint & TypeScript di tiap PR

## H. Timeline
- Prinsip: **app jadi secepatnya**, perbaikan menyusul
- **Target 3 hari (inti):** scan QR, login, PIN, halaman Menu kasir + keranjang + bayar + Order Selesai, riwayat Order + batalkan, Kelola Produk dasar (kategori, item, harga), Laporan dasar
- **Setelahnya:** varian & topping, harga ojol, stok, member, pengeluaran, dashboard owner lengkap, printer, notifikasi cekring di HP owner, build APK
