import { Pressable, TextInput, View, type TextInputProps } from "react-native";
import { Search, X } from "lucide-react-native";
import { colors } from "@/constants/colors";

/** Kolom pencarian dengan ikon kaca pembesar & tombol hapus. */
export function SearchInput({
  value,
  onChangeText,
  className = "",
  ...props
}: TextInputProps & { value: string; onChangeText: (text: string) => void; className?: string }) {
  return (
    <View className={`h-11 flex-row items-center gap-2 rounded-full bg-panel px-4 ${className}`}>
      <Search size={18} color={colors.inkMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Cari..."
        placeholderTextColor={colors.inkMuted}
        className="h-full flex-1 font-sans text-base text-ink"
        autoCorrect={false}
        {...props}
      />
      {value ? (
        <Pressable onPress={() => onChangeText("")} hitSlop={8}>
          <X size={18} color={colors.inkMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}
