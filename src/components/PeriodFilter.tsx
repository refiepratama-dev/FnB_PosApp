import { useState } from "react";
import { Pressable, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { AppText } from "./AppText";
import { CalendarModal } from "./CalendarModal";
import { Chip } from "./Chip";
import { colors } from "@/constants/colors";
import { isFuturePeriod, periodLabel, shiftPeriod, todayPeriod, type Period, type PeriodType } from "@/lib/period";

const TABS: { type: PeriodType; label: string }[] = [
  { type: "today", label: "Hari Ini" },
  { type: "date", label: "Tanggal" },
  { type: "week", label: "Minggu" },
  { type: "month", label: "Bulan" },
];

/**
 * Filter periode untuk Laporan / Pengeluaran / Order.
 *
 *   const [period, setPeriod] = useState(todayPeriod());
 *   const { from, to } = periodRange(period);   // dipakai untuk query
 *   <PeriodFilter value={period} onChange={setPeriod} />
 */
export function PeriodFilter({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const next = shiftPeriod(value, 1);
  const canGoNext = !isFuturePeriod(next);

  function selectTab(type: PeriodType) {
    if (type === "today") onChange(todayPeriod());
    else if (type === "date") setCalendarOpen(true);
    else onChange({ type, anchor: value.anchor });
  }

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        {TABS.map((tab) => (
          <Chip key={tab.type} label={tab.label} active={value.type === tab.type} onPress={() => selectTab(tab.type)} />
        ))}
      </View>

      <View className="h-12 flex-row items-center justify-between rounded-full bg-panel px-1">
        <Pressable
          onPress={() => onChange(shiftPeriod(value, -1))}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-line"
        >
          <ChevronLeft size={20} color={colors.ink} />
        </Pressable>
        <AppText variant="heading" className="text-sm">
          {periodLabel(value)}
        </AppText>
        <Pressable
          disabled={!canGoNext}
          onPress={() => onChange(next)}
          className={`h-10 w-10 items-center justify-center rounded-full active:bg-line ${canGoNext ? "" : "opacity-30"}`}
        >
          <ChevronRight size={20} color={colors.ink} />
        </Pressable>
      </View>

      {calendarOpen ? (
        <CalendarModal
          visible
          value={value.anchor}
          onClose={() => setCalendarOpen(false)}
          onSelect={(date) => onChange({ type: "date", anchor: date })}
        />
      ) : null}
    </View>
  );
}
