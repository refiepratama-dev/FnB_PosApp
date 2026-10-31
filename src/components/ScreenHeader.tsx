import { View } from "react-native";
import { AppText } from "./AppText";

/** Judul halaman + tombol di kanan (misal "+ Tambah"). Menempel ke atas, dipisah garis tipis. */
export function ScreenHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View className="h-16 flex-row items-center justify-between border-b border-line bg-white px-5">
      <AppText variant="heading" numberOfLines={1} className="mr-3 flex-1 text-xl">
        {title}
      </AppText>
      {right}
    </View>
  );
}
