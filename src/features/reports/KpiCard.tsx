import { View } from "react-native";
import { AppText } from "@/components/AppText";

/**
 * Kartu angka (KPI). tone mengubah warna angka: positif hijau, negatif merah.
 * tone "highlight": kartu penuh warna brand dengan teks putih (dipakai Omzet di Laporan).
 */
export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
  style,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "brand" | "good" | "bad" | "highlight";
  style?: object;
}) {
  const filled = tone === "highlight";
  const color = { default: "", brand: "text-brand", good: "text-success", bad: "text-action", highlight: "text-white" }[tone];
  return (
    <View style={style} className={`rounded-3xl border p-4 ${filled ? "border-brand bg-brand" : "border-line bg-white"}`}>
      <AppText variant="muted" className={`text-xs ${filled ? "text-white opacity-80" : ""}`}>
        {label}
      </AppText>
      <AppText variant="heading" numberOfLines={1} adjustsFontSizeToFit className={`mt-1 text-xl ${color}`}>
        {value}
      </AppText>
      {hint ? (
        <AppText variant="muted" numberOfLines={1} className={`mt-0.5 text-[11px] ${filled ? "text-white opacity-80" : ""}`}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
