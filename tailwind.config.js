/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Palet TemanPOS (lihat docs/06-DESIGN.md)
      colors: {
        // Warna diambil dari logo: batang biru, daun oranye, daun hijau
        brand: { DEFAULT: "#006DB0", soft: "#E3F1FA", strong: "#00578D" }, // biru: tombol utama, pilihan aktif, link
        accent: { DEFAULT: "#FE801A", soft: "#FFF1E5", ink: "#A84A06" }, // oranye: menu/kategori aktif, badge keranjang, diskon
        success: { DEFAULT: "#067D1E", soft: "#E6F6EA", leaf: "#09AA29" }, // hijau: Bayar, Lunas, berhasil
        action: { DEFAULT: "#D92D20", soft: "#FEECEB" }, // merah: hapus, batal, habis, pesan error
        navy: "#0B2545", // judul besar
        ink: { DEFAULT: "#101828", muted: "#667085" }, // teks
        panel: "#F5F6F8", // background panel
        line: "#E4E7EC", // garis pemisah tipis
      },
      fontFamily: {
        sans: ["DMSans_500Medium"],
        regular: ["DMSans_400Regular"],
        heading: ["DMSans_700Bold"],
      },
    },
  },
  plugins: [],
};
