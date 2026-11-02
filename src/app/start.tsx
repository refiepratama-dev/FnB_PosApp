import { Image, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { useOrientation } from "@/lib/orientation";
import { useSession } from "@/store/session";

/** Layar Awal: pilih masuk sebagai Kasir (langsung) atau Owner (pakai PIN). */
export default function StartScreen() {
  useOrientation("free");
  const storeName = useSession((s) => s.storeName);
  const setMode = useSession((s) => s.setMode);

  async function enterCashier() {
    await setMode("cashier");
    router.replace("/cashier/menu");
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-sm items-center">
          <Image source={require("../../assets/logo-mark.png")} className="mb-4 h-24 w-[86px]" resizeMode="contain" />
          <AppText variant="heading" className="text-center text-3xl">
            {storeName || "TemanPOS"}
          </AppText>
          <AppText variant="muted" className="mb-10 mt-1">
            TemanPOS
          </AppText>

          <Button title="Masuk sebagai Kasir" variant="action" className="mb-3 w-full" onPress={enterCashier} />
          <Button title="Masuk sebagai Owner" variant="outline" className="w-full" onPress={() => router.push("/pin")} />
        </View>
      </View>
    </SafeAreaView>
  );
}
