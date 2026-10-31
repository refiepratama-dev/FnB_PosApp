import { View } from "react-native";
import { AppText } from "@/components/AppText";

/** Kartu angka (KPI). tone mengubah warna angka: positif hijau, negatif merah. */
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
  tone?: "default" | "brand" | "good" | "bad";
  style?: object;
}) {
  const color = { default: "", brand: "text-brand", good: "text-success", bad: "text-action" }[tone];
  return (
    <View style={style} className="rounded-3xl border border-line bg-white p-4">
      <AppText variant="muted" className="text-xs">
        {label}
      </AppText>
      <AppText variant="heading" numberOfLines={1} adjustsFontSizeToFit className={`mt-1 text-xl ${color}`}>
        {value}
      </AppText>
      {hint ? (
        <AppText variant="muted" numberOfLines={1} className="mt-0.5 text-[11px]">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
