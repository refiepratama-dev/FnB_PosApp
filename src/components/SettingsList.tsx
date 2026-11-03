import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { ChevronRight, Lock, LogOut, type LucideIcon } from "lucide-react-native";
import { AppText } from "./AppText";
import { OwnerPinModal } from "./OwnerPinModal";
import { colors } from "@/constants/colors";
import { useSession } from "@/store/session";

export type SettingItem = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  ownerOnly?: boolean; // di mode kasir minta PIN owner dulu
};

function Row({
  label,
  icon: Icon,
  onPress,
  danger = false,
  locked = false,
  first = false,
}: {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  danger?: boolean;
  locked?: boolean;
  first?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-16 flex-row items-center gap-3.5 px-4 active:bg-panel ${first ? "" : "border-t border-line"}`}
    >
      <View className={`h-10 w-10 items-center justify-center rounded-xl ${danger ? "bg-action-soft" : "bg-brand-soft"}`}>
        <Icon size={20} color={danger ? colors.action : colors.brand} />
      </View>
      <AppText className={`flex-1 text-base ${danger ? "text-action" : ""}`}>{label}</AppText>
      {locked && <Lock size={16} color={colors.inkMuted} />}
      {!danger && <ChevronRight size={18} color={colors.inkMuted} />}
    </Pressable>
  );
}

/**
 * Daftar menu Setting, dipakai mode Owner & Kasir (isinya sama).
 * Item dengan ownerOnly: di mode Kasir tampil dengan ikon gembok dan minta PIN owner dulu
 * (docs/02-USERS-ROLES.md bagian D). Di mode Owner langsung terbuka.
 */
export function SettingsList({ items = [] }: { items?: SettingItem[] }) {
  const signOut = useSession((s) => s.signOut);
  const mode = useSession((s) => s.mode);
  const [pinFor, setPinFor] = useState<SettingItem | null>(null);

  function press(item: SettingItem) {
    if (item.ownerOnly && mode === "cashier") setPinFor(item);
    else item.onPress();
  }

  function onPinVerified() {
    const item = pinFor;
    setPinFor(null);
    // beri jeda supaya popup PIN tertutup penuh sebelum popup/halaman berikutnya dibuka (iOS)
    if (item) setTimeout(item.onPress, 350);
  }

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
    <ScrollView className="flex-1 bg-panel" contentContainerClassName="w-full max-w-2xl gap-4 p-4">
      {/* Daftar pengaturan dalam satu kartu */}
      <View className="overflow-hidden rounded-2xl border border-line bg-white">
        {items.map((item, i) => (
          <Row
            key={item.label}
            label={item.label}
            icon={item.icon}
            first={i === 0}
            locked={!!item.ownerOnly && mode === "cashier"}
            onPress={() => press(item)}
          />
        ))}
      </View>

      {/* Logout di kartu terpisah supaya tidak tertekan tanpa sengaja */}
      <View className="overflow-hidden rounded-2xl border border-line bg-white">
        <Row label="Logout akun" icon={LogOut} onPress={confirmLogout} danger first />
      </View>

      {mode === "cashier" ? (
        <View className="flex-row items-center gap-2 px-1">
          <Lock size={14} color={colors.inkMuted} />
          <AppText variant="muted" className="flex-1 text-xs">
            Menu bergembok minta PIN owner dulu
          </AppText>
        </View>
      ) : null}

      <OwnerPinModal
        visible={pinFor !== null}
        title={pinFor ? `PIN Owner: ${pinFor.label}` : "PIN Owner"}
        onClose={() => setPinFor(null)}
        onVerified={onPinVerified}
      />
    </ScrollView>
  );
}
