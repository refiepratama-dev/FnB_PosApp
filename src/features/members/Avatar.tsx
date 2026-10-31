import { View } from "react-native";
import { AppText } from "@/components/AppText";

/** Lingkaran dengan huruf pertama nama member. */
export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const letter = name.trim()[0]?.toUpperCase() ?? "?";
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center bg-brand-soft"
    >
      <AppText variant="heading" className="text-brand" style={{ fontSize: Math.round(size * 0.42) }}>
        {letter}
      </AppText>
    </View>
  );
}
