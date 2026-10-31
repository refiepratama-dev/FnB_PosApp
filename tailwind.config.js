/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Palet TemanPOS (lihat docs/06-DESIGN.md)
      colors: {
        brand: { DEFAULT: "#1A4FE8", soft: "#E8EEFD" }, // biru: pilihan aktif, link
        action: { DEFAULT: "#EE2A24", soft: "#FDEAEA" }, // merah: Bayar, Lunas, badge
        success: "#16A34A", // hijau: centang Order Selesai
        ink: { DEFAULT: "#18181B", muted: "#71717A" }, // teks
        panel: "#F7F7F8", // background panel
        line: "#E4E4E7", // garis pemisah tipis
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
