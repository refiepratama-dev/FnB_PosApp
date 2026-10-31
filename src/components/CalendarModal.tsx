import { useState } from "react";
import { Pressable, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { AppModal } from "./AppModal";
import { AppText } from "./AppText";
import { colors } from "@/constants/colors";
import { formatMonth, toISODate } from "@/lib/format";

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/** Kalender sederhana untuk memilih 1 tanggal (tanggal di masa depan tidak bisa dipilih). */
export function CalendarModal({
  visible,
  value,
  onClose,
  onSelect,
}: {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
}) {
  const [month, setMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1));
  const today = toISODate(new Date());
  const selected = toISODate(value);

  const firstWeekday = (month.getDay() + 6) % 7; // Senin = 0
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];

  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const canGoNext = toISODate(nextMonth) <= today;

  return (
    <AppModal visible={visible} title="Pilih Tanggal" onClose={onClose}>
      <View className="mb-4 flex-row items-center justify-between">
        <Pressable
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className="h-10 w-10 items-center justify-center rounded-full bg-panel"
        >
          <ChevronLeft size={20} color={colors.ink} />
        </Pressable>
        <AppText variant="heading" className="text-base">
          {formatMonth(month)}
        </AppText>
        <Pressable
          disabled={!canGoNext}
          onPress={() => setMonth(nextMonth)}
          className={`h-10 w-10 items-center justify-center rounded-full bg-panel ${canGoNext ? "" : "opacity-30"}`}
        >
          <ChevronRight size={20} color={colors.ink} />
        </Pressable>
      </View>

      <View className="flex-row">
        {DAYS.map((d) => (
          <AppText key={d} variant="muted" className="w-[14.28%] pb-2 text-center text-xs">
            {d}
          </AppText>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {cells.map((date, i) => {
          if (!date) return <View key={i} className="h-11 w-[14.28%]" />;
          const iso = toISODate(date);
          const isFuture = iso > today;
          const isSelected = iso === selected;
          return (
            <Pressable
              key={i}
              disabled={isFuture}
              onPress={() => {
                onSelect(date);
                onClose();
              }}
              className="h-11 w-[14.28%] items-center justify-center"
            >
              <View
                className={`h-10 w-10 items-center justify-center rounded-full ${
                  isSelected ? "bg-brand" : iso === today ? "border border-brand" : ""
                }`}
              >
                <AppText className={`text-sm ${isSelected ? "font-heading text-white" : isFuture ? "text-line" : ""}`}>
                  {date.getDate()}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </AppModal>
  );
}
