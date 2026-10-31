import { Pressable, View } from "react-native";
import { Slot, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { OwnerTabBar } from "@/components/OwnerTabBar";
import { colors } from "@/constants/colors";
import { useOrientation } from "@/lib/orientation";

/** Layout mode Owner: wajib portrait, top bar + isi halaman + navbar bawah. */
export default function OwnerLayout() {
  useOrientation("portrait");

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={["top"]} className="border-b border-line bg-white">
        <View className="h-14 flex-row items-center justify-between px-4">
          {/* TODO: ganti dengan nama toko dari database */}
          <AppText variant="heading" className="text-lg">
            Nama Toko
          </AppText>
          <Pressable
            onPress={() => router.replace("/start")}
            className="h-10 flex-row items-center gap-2 rounded-full bg-panel px-4"
          >
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
