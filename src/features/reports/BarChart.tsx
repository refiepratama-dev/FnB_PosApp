import { useState } from "react";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import type { Bar } from "@/lib/report";

/**
 * Grafik batang sederhana (1 seri, 1 warna). Tap batang untuk melihat nilainya.
 * Tanpa library supaya ringan dan rapi di HP maupun tablet.
 */
export function BarChart({
  data,
  format,
  height = 150,
  unitLabel,
}: {
  data: Bar[];
  format: (value: number) => string;
  height?: number;
  unitLabel?: (bar: Bar) => string; // teks label saat batang dipilih, misal "Jam 12"
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const max = Math.max(0, ...data.map((d) => d.value));
  const peakIndex = max > 0 ? data.findIndex((d) => d.value === max) : -1;
  const shown = selected ?? peakIndex;
  // Label sumbu bawah dijarangkan supaya tidak bertumpuk (maks ~10 label)
  const step = Math.max(1, Math.ceil(data.length / 10));

  return (
    <View>
      <View className="mb-3 h-10 justify-center">
        {shown >= 0 ? (
          <>
            <AppText variant="muted" className="text-xs">
              {selected === null ? "Tertinggi · " : ""}
              {unitLabel ? unitLabel(data[shown]) : data[shown].label}
            </AppText>
            <AppText variant="heading" className="text-base">
              {format(data[shown].value)}
            </AppText>
          </>
        ) : (
          <AppText variant="muted" className="text-sm">
            Belum ada data
          </AppText>
        )}
      </View>

      <View style={{ height }} className="flex-row items-end border-b border-line">
        {data.map((d, i) => {
          const h = max > 0 ? Math.max(d.value > 0 ? 3 : 0, (d.value / max) * (height - 4)) : 0;
          const active = i === shown;
          return (
            <Pressable
              key={`${d.label}-${i}`}
              onPress={() => setSelected(i === selected ? null : i)}
              className="h-full flex-1 justify-end"
              style={{ paddingHorizontal: 1 }} // celah 2px antar batang
              hitSlop={4}
            >
              <View
                style={{ height: h, borderTopLeftRadius: 4, borderTopRightRadius: 4 }}
                className={active ? "bg-brand" : "bg-brand/40"}
              />
            </Pressable>
          );
        })}
      </View>

      <View className="mt-1 flex-row">
        {data.map((d, i) => (
          <View key={`${d.label}-l-${i}`} className="flex-1 items-center">
            {i % step === 0 ? (
              <AppText variant="muted" numberOfLines={1} className="text-[10px]">
                {d.label}
              </AppText>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}
