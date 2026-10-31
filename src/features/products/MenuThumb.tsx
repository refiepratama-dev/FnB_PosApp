import { useState } from "react";
import { Image, View } from "react-native";
import { AppText } from "@/components/AppText";

// Warna lembut untuk kotak inisial (menu tanpa foto). Dipilih berdasarkan nama, jadi selalu sama.
const SWATCHES = ["#E8EEFD", "#FDEAEA", "#E7F6EC", "#FEF3C7", "#F3E8FF", "#E0F2FE"];
const SWATCH_TEXT = ["#1A4FE8", "#EE2A24", "#16A34A", "#B45309", "#7E22CE", "#0369A1"];

function hash(text: string) {
  let value = 0;
  for (let i = 0; i < text.length; i++) value = (value * 31 + text.charCodeAt(i)) % 997;
  return value;
}

/** "Es Teh Manis" -> "ET", "Kopi" -> "K" */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** Foto menu persegi. Tanpa foto (atau foto gagal dimuat) -> kotak warna + inisial nama. */
export function MenuThumb({ name, imageUrl, size = 64 }: { name: string; imageUrl: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const radius = Math.round(size * 0.22);

  if (imageUrl && !failed) {
    return (
      <Image
        source={{ uri: imageUrl }}
        onError={() => setFailed(true)}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="cover"
      />
    );
  }

  const index = hash(name) % SWATCHES.length;
  return (
    <View
      style={{ width: size, height: size, borderRadius: radius, backgroundColor: SWATCHES[index] }}
      className="items-center justify-center"
    >
      <AppText variant="heading" style={{ fontSize: Math.round(size * 0.34), color: SWATCH_TEXT[index] }}>
        {initialsOf(name)}
      </AppText>
    </View>
  );
}
