# TemanPOS

Aplikasi POS untuk UMKM F&B. React Native + Expo + Supabase.
Semua keputusan produk ada di folder [`docs/`](docs/00-README.md).

## Setup pertama kali (laptop baru)

1. Install [Node.js](https://nodejs.org) (versi LTS) dan [Git](https://git-scm.com).
2. Clone repo:
   ```bash
   git clone https://github.com/refiepratama-dev/FnB_PosApp.git
   cd FnB_PosApp
   ```
3. Install library:
   ```bash
   npm install
   ```
4. Salin `.env.example` jadi `.env`, lalu isi key Supabase (minta ke Refie lewat chat pribadi).
   **File `.env` jangan pernah di-commit.**
5. Install aplikasi **Expo Go** di HP/tablet Android (Play Store).

## Menjalankan app

```bash
npx expo start
```
Scan QR yang muncul di terminal pakai Expo Go. Laptop dan HP harus di WiFi yang sama.
Kalau tidak tersambung, coba `npx expo start --tunnel`.

## Perintah penting

| Perintah | Fungsi |
|----------|--------|
| `npx expo start` | Jalankan app |
| `npx expo start -c` | Jalankan app + hapus cache (kalau tampilan aneh) |
| `npm run typecheck` | Cek error TypeScript sebelum bikin PR |
| `npx expo install <nama-library>` | Tambah library (jangan pakai `npm install` biasa) |

## Struktur folder

```
src/
  app/            Halaman (setiap file = 1 layar, aturan Expo Router)
    start.tsx     Layar Awal (pilih Kasir / Owner)
    pin.tsx       Masukkan PIN owner
    cashier/      Mode Kasir (landscape, sidebar kiri)
    owner/        Mode Owner (portrait, navbar bawah)
  components/     Komponen yang dipakai ulang (AppText, Button, dll)
  constants/      Warna, dll
  lib/            Fungsi bantuan (orientasi, supabase, dll)
docs/             Dokumen requirement & panduan
```

## Aturan coding singkat

- Styling pakai **className** (NativeWind/Tailwind). Warna: `brand` (biru), `action` (merah), `success` (hijau), `ink`, `panel`, `line`.
- Teks pakai `<AppText>`, bukan `<Text>`, supaya font DM Sans terpasang.
- Ikon dari `lucide-react-native`.
- Import dari folder `src` pakai `@/`, contoh: `import { Button } from "@/components/Button"`.
- Nama variabel & kode bahasa Inggris. Teks di layar bahasa Indonesia.

## Kerja tim

Baca [`docs/GIT-GUIDE.md`](docs/GIT-GUIDE.md) sebelum mulai. Ringkasnya: **jangan kerja di `main`**,
selalu bikin branch, lalu Pull Request.
