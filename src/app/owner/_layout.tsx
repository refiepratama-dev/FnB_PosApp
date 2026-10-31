import { Pressable, View } from "react-native";
import { Redirect, Slot, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { OwnerTabBar } from "@/components/OwnerTabBar";
import { colors } from "@/constants/colors";
import { useOwnerOrderAlerts } from "@/hooks/useOwnerOrderAlerts";
import { useOrientation } from "@/lib/orientation";
import { useSession } from "@/store/session";

/** Layout mode Owner: wajib portrait, top bar + isi halaman + navbar bawah. */
export default function OwnerLayout() {
  useOrientation("portrait");
  const status = useSession((s) => s.status);
  const mode = useSession((s) => s.mode);
  const storeName = useSession((s) => s.storeName);
  const setMode = useSession((s) => s.setMode);

  // Bunyi cekring + update data saat ada order baru (hanya saat sudah masuk mode Owner)
  useOwnerOrderAlerts(status === "signedIn" && mode === "owner");

  // Hanya boleh masuk lewat PIN
  if (status !== "signedIn") return <Redirect href="/" />;
  if (mode !== "owner") return <Redirect href="/start" />;

  async function exit() {
    await setMode(null);
    router.replace("/start");
  }

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={["top"]} className="border-b border-line bg-white">
        <View className="h-14 flex-row items-center justify-between px-4">
          <AppText variant="heading" numberOfLines={1} className="mr-3 flex-1 text-lg">
            {storeName || "TemanPOS"}
          </AppText>
          <Pressable onPress={exit} className="h-10 flex-row items-center gap-2 rounded-full bg-panel px-4 active:bg-line">
            <LogOut size={18} color={colors.ink} />
            <AppText className="text-sm">Keluar</AppText>
          </Pressable>
        </View>
      </SafeAreaView>
      <View className="flex-1">
        <Slot />
      </View>
      <OwnerTabBar />
    </View>
  );
}
