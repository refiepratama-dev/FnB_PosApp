import { Alert, Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { ChevronRight, LogOut, type LucideIcon } from "lucide-react-native";
import { AppText } from "./AppText";
import { colors } from "@/constants/colors";
import { useSession } from "@/store/session";

export type SettingItem = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  ownerOnly?: boolean; // di mode kasir minta PIN owner dulu
};

function Row({ label, icon: Icon, onPress, danger = false }: { label: string; icon: LucideIcon; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} className="h-14 flex-row items-center gap-3 border-b border-line px-4 active:bg-panel">
      <Icon size={20} color={danger ? colors.action : colors.ink} />
      <AppText className={`flex-1 text-base ${danger ? "text-action" : ""}`}>{label}</AppText>
      {!danger && <ChevronRight size={18} color={colors.inkMuted} />}
    </Pressable>
  );
}

/**
 * Daftar menu Setting, dipakai mode Owner & Kasir (isinya sama).
 * TODO (langkah 4): tambah menu pajak, ojol, printer, struk, ubah PIN, QR toko, kelola produk.
 */
export function SettingsList({ items = [] }: { items?: SettingItem[] }) {
  const signOut = useSession((s) => s.signOut);

  function confirmLogout() {
    Alert.alert(
      "Logout akun?",
      "Device ini akan terputus dan harus login pakai password toko lagi.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/login");
          },
        },
      ],
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="border-t border-line">
        {items.map((item) => (
          <Row key={item.label} label={item.label} icon={item.icon} onPress={item.onPress} />
        ))}
        <Row label="Logout akun" icon={LogOut} onPress={confirmLogout} danger />
      </View>
    </ScrollView>
  );
}
