# 06 · Design / UI-UX

## A. Perangkat & orientasi
1. Perangkat:
   Jawaban: HP dan tablet, untuk mode Kasir maupun Owner.
2. Orientasi layar:
   Jawaban: **Dikunci per mode**, berlaku di HP maupun tablet:
   - **Kasir: wajib landscape**, responsif (HP landscape & tablet landscape)
   - **Owner: wajib portrait**, responsif (HP portrait & tablet portrait)
   - Layar awal (pilih Kasir/Owner, PIN, login, scan QR): mengikuti orientasi device
3. Ukuran layar minimum yang harus didukung (misal HP 5.5")?
   Jawaban:
4. Perangkat dapur (kalau ada KDS)?
   Jawaban:
5. Perlu versi web (owner dashboard / pakai di laptop)? Expo bisa web juga.
   Jawaban:

## B. Branding
6. Sudah ada logo & nama brand? (lampirkan file)
   Jawaban: Nama **TemanPOS**. Logo belum ada, menyusul (sementara pakai teks/placeholder).
7. Warna utama (hex kalau ada) dan nuansa yang diinginkan?
   Jawaban: Minimalis, modern, dominan putih. Merah mengikuti **tombol "Checkout" di gambar referensi** (merah terang, perkiraan `#EE2A24`, finalkan saat coding). Biru di referensi: **dipakai juga**. Palet: **putih + merah + biru**, sesuai gambar referensi.
   Pembagian peran (usulan, mengikuti referensi):
   - **Biru** (perkiraan `#1A4FE8`): warna brand & pilihan aktif. Item sidebar/navbar aktif, chip kategori terpilih, tab filter aktif, link, tombol sekunder.
   - **Merah** (perkiraan `#EE2A24`): aksi transaksi & penanda penting. Tombol Bayar / Lunas / Simpan order, badge jumlah keranjang, label diskon, label Habis, Batalkan.
   - **Putih** dominan untuk background & kartu, abu muda untuk panel & garis.
8. Font pilihan (atau terserah)?
   Jawaban: **DM Sans** (judul Bold, teks Medium), sama seperti app laundry. Dipasang via `@expo-google-fonts/dm-sans`.
9. Mode tampilan:
   - [x] Light saja (dark mode fase 2)

## C. Gaya visual
10. Referensi visual (link Dribbble, Behance, screenshot app lain). Lampirkan minimal 2–3.
    Jawaban:
11. Gaya yang disukai:
   - [ ] Flat minimalis  - [ ] Glassmorphism  - [ ] Material Design  - [ ] iOS-like  - [ ] Neumorphism  - [ ] Lainnya: ______
12. Menu ditampilkan dengan foto atau teks saja (lebih cepat untuk kasir)?
    Jawaban:
13. Ikon: library tertentu (Lucide, Phosphor, Material Icons) atau terserah?
    Jawaban: **Lucide** (`lucide-react-native`), sama seperti app laundry.

## D. UX kasir
14. Target kecepatan: berapa tap maksimal dari pilih menu sampai bayar?
    Jawaban:
15. Kasir pakai satu tangan (HP) atau dua tangan (tablet di meja)?
    Jawaban:
16. Ukuran tombol besar (untuk jari, layar sentuh cepat)?
    Jawaban:
17. Feedback suara/getar saat tap atau transaksi berhasil?
    Jawaban:
18. Perlu tampilan untuk pelanggan (customer display: layar kedua yang menghadap pelanggan)?
    Jawaban:

## E. Aksesibilitas
19. Ukuran teks bisa diperbesar? Kontras tinggi?
    Jawaban:

## F. Aset
20. Siapa yang mendesain mockup?
   Jawaban: **Tidak pakai mockup**, langsung coding mengikuti dokumen ini.
21. Ilustrasi untuk empty state / onboarding?
    Jawaban: Ikon + teks sederhana saja.

## G. Keputusan desain lainnya ✅
- Panel yang menempel (sidebar, top bar, ringkasan order) dipisah **garis tipis**, tanpa celah/bayangan. Kartu menu rounded dengan bayangan halus.
- Tombol utama besar, bentuk **pill**.
- Centang layar **Order Selesai**: **hijau**.
- Grid menu pakai foto; tanpa foto → kotak warna + inisial nama menu. Kartu: foto, nama, harga, label "Habis".
- Getar ringan saat item masuk keranjang; cekring saat order dibuat.
- Tidak ada customer display.

## Catatan tambahan
