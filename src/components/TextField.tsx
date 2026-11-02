import { useState } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { AppText } from "./AppText";
import { colors } from "@/constants/colors";

/**
 * Input teks dengan label, sesuai gaya TemanPOS.
 * Kalau diberi secureTextEntry (password), otomatis ada tombol mata untuk lihat / sembunyikan.
 */
export function TextField({
  label,
  className = "",
  secureTextEntry,
  ...props
}: TextInputProps & { label: string; className?: string }) {
  const [hidden, setHidden] = useState(true);
  const isPassword = !!secureTextEntry;

  return (
    <View className={className}>
      <AppText className="mb-2 text-sm">{label}</AppText>
      <View className="justify-center">
        <TextInput
          placeholderTextColor={colors.inkMuted}
          secureTextEntry={isPassword && hidden}
          autoCapitalize={isPassword ? "none" : props.autoCapitalize}
          autoCorrect={isPassword ? false : props.autoCorrect}
          className={`h-14 rounded-2xl border border-line bg-panel font-sans text-base text-ink focus:border-brand ${
            isPassword ? "pl-4 pr-14" : "px-4"
          }`}
          {...props}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            accessibilityLabel={hidden ? "Lihat password" : "Sembunyikan password"}
            className="absolute right-2 h-11 w-11 items-center justify-center rounded-full active:bg-line"
          >
            {hidden ? <Eye size={20} color={colors.inkMuted} /> : <EyeOff size={20} color={colors.inkMuted} />}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
