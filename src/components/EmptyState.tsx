import { View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { AppText } from "./AppText";
import { colors } from "@/constants/colors";

/** Tampilan saat data kosong. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode; // misal tombol "Tambah"
}) {
  return (
    <View className="flex-1 items-center justify-center gap-2 p-8">
      <View className="mb-2 h-16 w-16 items-center justify-center rounded-full bg-panel">
        <Icon size={28} color={colors.inkMuted} />
      </View>
      <AppText variant="heading" className="text-center text-lg">
        {title}
      </AppText>
      {description ? (
        <AppText variant="muted" className="text-center">
          {description}
        </AppText>
      ) : null}
      {children ? <View className="mt-3">{children}</View> : null}
    </View>
  );
}
