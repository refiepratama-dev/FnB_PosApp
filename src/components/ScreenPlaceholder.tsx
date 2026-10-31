import { View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { AppText } from "./AppText";
import { colors } from "@/constants/colors";

/**
 * Isi sementara untuk halaman yang belum dibuat.
 * Ganti komponen ini dengan isi asli saat mengerjakan fiturnya.
 */
export function ScreenPlaceholder({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-white p-6">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-soft">
        <Icon size={28} color={colors.brand} />
      </View>
      <AppText variant="heading" className="text-xl">
        {title}
      </AppText>
      <AppText variant="muted">Halaman ini belum dibuat.</AppText>
    </View>
  );
}
