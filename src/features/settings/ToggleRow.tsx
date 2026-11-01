import { Switch, View } from "react-native";
import { AppText } from "@/components/AppText";
import { colors } from "@/constants/colors";

/** Baris judul + keterangan + saklar on/off (dipakai di form Setting). */
export function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-1">
        <AppText variant="heading" className="text-base">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="muted" className="text-xs">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.line, true: colors.brand }}
        thumbColor={colors.white}
      />
    </View>
  );
}
