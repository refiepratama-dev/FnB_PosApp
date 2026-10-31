import { Pressable } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { colors } from "@/constants/colors";

/** Tombol kecil di kanan ScreenHeader, misal "+ Menu". */
export function HeaderAction({
  label,
  icon: Icon,
  onPress,
  variant = "brand",
}: {
  label: string;
  icon?: LucideIcon;
  onPress: () => void;
  variant?: "brand" | "outline";
}) {
  const filled = variant === "brand";
  return (
    <Pressable
      onPress={onPress}
      className={`h-10 flex-row items-center gap-1.5 rounded-full px-4 active:opacity-80 ${
        filled ? "bg-brand" : "border border-brand bg-white"
      }`}
    >
      {Icon ? <Icon size={18} color={filled ? colors.white : colors.brand} /> : null}
      <AppText variant="heading" className={`text-sm ${filled ? "text-white" : "text-brand"}`}>
        {label}
      </AppText>
    </Pressable>
  );
}
