import { View } from "react-native";
import { Redirect, Slot } from "expo-router";
import { CashierSidebar } from "@/components/CashierSidebar";
import { useOrientation } from "@/lib/orientation";
import { useSession } from "@/store/session";

/** Layout mode Kasir: wajib landscape, sidebar kiri + isi halaman. */
export default function CashierLayout() {
  useOrientation("landscape");
  const status = useSession((s) => s.status);

  if (status !== "signedIn") return <Redirect href="/" />;

  return (
    <View className="flex-1 flex-row bg-white">
      <CashierSidebar />
      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
}
