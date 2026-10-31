import { TextInput, View, type TextInputProps } from "react-native";
import { AppText } from "./AppText";
import { colors } from "@/constants/colors";

/** Input teks dengan label, sesuai gaya TemanPOS. */
export function TextField({
  label,
  className = "",
  ...props
}: TextInputProps & { label: string; className?: string }) {
  return (
    <View className={className}>
      <AppText className="mb-2 text-sm">{label}</AppText>
      <TextInput
        placeholderTextColor={colors.inkMuted}
        className="h-14 rounded-2xl border border-line bg-panel px-4 font-sans text-base text-ink focus:border-brand"
        {...props}
      />
    </View>
  );
}
