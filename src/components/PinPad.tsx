import { Pressable, View } from "react-native";
import { Delete } from "lucide-react-native";
import { AppText } from "./AppText";
import { colors } from "@/constants/colors";

export const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

/**
 * Tombol angka + titik PIN. Komponen ini hanya menampilkan;
 * logika cek PIN ada di halaman yang memakainya.
 */
export function PinPad({
  value,
  onChange,
  error = false,
  disabled = false,
}: {
  value: string;
  onChange: (pin: string) => void;
  error?: boolean;
  disabled?: boolean;
}) {
  function press(key: string) {
    if (disabled) return;
    if (key === "del") onChange(value.slice(0, -1));
    else if (value.length < PIN_LENGTH) onChange(value + key);
  }

  return (
    <View className="w-full max-w-xs items-center">
      <View className="mb-8 flex-row gap-4">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            className={`h-4 w-4 rounded-full ${error ? "bg-action" : i < value.length ? "bg-brand" : "bg-line"}`}
          />
        ))}
      </View>

      <View className={`w-full flex-row flex-wrap justify-between ${disabled ? "opacity-50" : ""}`}>
        {KEYS.map((key, i) =>
          key === "" ? (
            <View key={i} className="mb-3 h-16 w-[30%]" />
          ) : (
            <Pressable
              key={i}
              onPress={() => press(key)}
              className="mb-3 h-16 w-[30%] items-center justify-center rounded-2xl bg-panel active:bg-brand-soft"
            >
              {key === "del" ? (
                <Delete size={24} color={colors.ink} />
              ) : (
                <AppText variant="heading" className="text-2xl">
                  {key}
                </AppText>
              )}
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}
