# TemanPOS: Dokumen Requirement

Kumpulan file ini adalah **sumber kebenaran (single source of truth)** untuk membangun TemanPOS.
Kalau ada keputusan baru, update file yang terkait di sini lewat PR.

## Daftar dokumen
| No | File | Isi | Status |
|----|------|-----|--------|
| 01 | `01-PRD.md` | Produk, bisnis, target, scope | ✅ |
| 02 | `02-USERS-ROLES.md` | Role, akun, hak akses | ✅ |
| 03 | `03-FEATURES.md` | Detail fitur per modul | ✅ |
| 04 | `04-FLOWS.md` | Alur kerja & daftar layar | ✅ |
| 05 | `05-BUSINESS-RULES-DATA.md` | Aturan hitung, penomoran, tabel data | ✅ |
| 06 | `06-DESIGN.md` | UI/UX, warna, font, ikon | ✅ |
| 07 | `07-TECH.md` | Stack, Supabase, keamanan | ✅ |
| 08 | `08-TEAM-WORKFLOW.md` | Kerja tim, Git, pembagian tugas | ✅ |
| 09 | `09-QUALITY-RELEASE.md` | Testing, backup, rilis | ✅ |

## Ringkasan cepat
- **Stack:** React Native + Expo (TypeScript), Supabase, NativeWind, DM Sans, Lucide
- **1 project Supabase per toko**, 1 APK untuk semua toko (scan QR toko saat pertama buka)
- **1 akun per toko** dengan 2 tampilan: **Owner** (portrait, PIN 4 digit, awal `0000`) & **Kasir** (landscape, tanpa PIN)
- **Online only**, semua order langsung bayar, tombol **Lunas**
- Palet **putih + merah + biru**

## Tim
- **Author / Owner repo**: Refie (`refiepratama-dev`)
- **Contributor**: Ridho (`Oxura2727`), Fahri (username menyusul)
