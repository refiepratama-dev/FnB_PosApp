# 07 · Teknis ✅

## A. Fondasi
- **React Native + Expo**, bahasa **TypeScript**
- Routing: **Expo Router** (file-based, folder `app/`)
- Styling: **NativeWind + React Native Reusables** (gaya shadcn), sama seperti app laundry
- Font **DM Sans** (`@expo-google-fonts/dm-sans`), ikon **Lucide** (`lucide-react-native`)
- State: **Zustand** (keranjang, mode kasir/owner, tipe order)
- Ambil data: **TanStack Query + supabase-js**
- Form: **React Hook Form + Zod**
- Grafik laporan: library yang jalan di Expo Go (dipilih saat mengerjakan laporan)
- Suara cekring: `expo-audio` · Getar: `expo-haptics` · Kunci orientasi: `expo-screen-orientation`
- Package manager: **npm** · **Expo SDK terbaru** saat mulai

## B. Expo Go vs Development Build
- Development pakai **Expo Go** dulu
- Pindah ke **development build** (`expo-dev-client`) saat mengerjakan **printer** dan **push notification dengan suara cekring**

## C. Build & rilis
- Build APK pakai **EAS Build** (cloud, tidak perlu Mac)
- Rilis **APK Android langsung** (tanpa Play Store)
- iPhone/iPad: belum (butuh akun Apple Developer berbayar)

## D. Koneksi internet
- **Online only.** Kalau internet putus: banner merah "Tidak ada internet", tombol Bayar/Simpan dikunci sampai online lagi.

## E. Supabase
- Region **Singapore**
- **1 project development** (dipakai bareng tim) + **1 project per toko**
- Struktur database sebagai **migration file di repo** (Supabase CLI). Toko baru / update database = jalankan perintah yang sama ke project toko tersebut.
- Fitur: **Auth** (1 akun email per toko), **Database + RLS**, **Realtime** (order masuk), **Storage** (foto menu, logo, foto nota)
- Paket Free selama memungkinkan, upgrade ke berbayar kalau dana cukup

## F. Koneksi ke toko & keamanan
- **QR toko** berisi alamat project + public (anon) key Supabase. Discan pakai `expo-camera` (jalan di Expo Go).
- Data hanya bisa dibaca/ditulis setelah login (RLS: hanya user yang login).
- Sesi login disimpan di device dan diperpanjang otomatis (login password cukup sekali per device, sampai Logout akun).
- Mode terakhir (Owner/Kasir) disimpan di device; app dibuka langsung ke mode itu tanpa PIN.
- **PIN owner: 1 PIN untuk semua device**, disimpan di database dalam bentuk hash (bukan angka asli). Ganti PIN di satu device berlaku di semua device.
- **PIN awal: `0000`** (di-set tim saat setup toko). Tidak ada pengingat ganti PIN di app; tim yang mengingatkan owner.

## G. Hardware
- Printer thermal **Bluetooth & USB** (USB hanya Android), kertas 58mm & 80mm. Library ESC/POS dipilih saat tahap printer.
- Merek printer untuk testing: belum ditentukan
- Device testing: **tablet Android** (mode kasir landscape) + HP tim

## H. Lain-lain
- Notifikasi: **Expo Notifications**
- Error tracking (Sentry), analytics: belum
- Minimum Android: mengikuti batas minimum Expo SDK yang dipakai
