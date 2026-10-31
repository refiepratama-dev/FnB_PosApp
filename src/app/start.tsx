import { View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Store } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { colors } from "@/constants/colors";
import { useOrientation } from "@/lib/orientation";

/** Layar Awal: pilih masuk sebagai Owner (pakai PIN) atau Kasir. */
export default function StartScreen() {
  useOrientation("free");

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-sm items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-brand-soft">
            <Store size={36} color={colors.brand} />
          </View>
          {/* TODO: ganti dengan logo & nama toko dari database */}
          <AppText variant="heading" className="text-3xl">
            TemanPOS
          </AppText>
          <AppText variant="muted" className="mb-10 mt-1">
            Nama Toko
          </AppText>

          <Button
            title="Masuk sebagai Kasir"
            variant="action"
            className="mb-3 w-full"
            onPress={() => router.replace("/cashier/menu")}
          />
          <Button
            title="Masuk sebagai Owner"
            variant="outline"
            className="w-full"
            onPress={() => router.push("/pin")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
