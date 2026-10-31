import { View } from "react-native";
import { Slot } from "expo-router";
import { CashierSidebar } from "@/components/CashierSidebar";
import { useOrientation } from "@/lib/orientation";

/** Layout mode Kasir: wajib landscape, sidebar kiri + isi halaman. */
export default function CashierLayout() {
  useOrientation("landscape");

  return (
    <View className="flex-1 flex-row bg-white">
      <CashierSidebar />
      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
}
