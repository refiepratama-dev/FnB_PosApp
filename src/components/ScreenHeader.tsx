import { useEffect } from "react";
import { BackHandler, Pressable, View } from "react-native";
import { router, usePathname, type Href } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { AppText } from "./AppText";
import { colors } from "@/constants/colors";

/**
 * Halaman yang dibuka dari halaman lain (bukan dari navbar Owner / sidebar Kasir).
 * Di halaman ini judul otomatis diberi tombol kembali di kiri.
 * Nilai = halaman tujuan saat kembali (juga dipakai tombol back bawaan Android).
 */
const SUB_PAGES: Record<string, Href> = {
  "/owner/stock": "/owner/dashboard",
  "/owner/expenses": "/owner/dashboard",
  "/owner/members": "/owner/dashboard",
  "/cashier/products": "/cashier/settings",
};

/** Judul halaman + tombol di kanan (misal "+ Tambah"). Menempel ke atas, dipisah garis tipis. */
export function ScreenHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const pathname = usePathname();
  const backTo = SUB_PAGES[pathname];

  // Tombol back bawaan Android ikut kembali ke halaman asal (bukan keluar aplikasi)
  useEffect(() => {
    if (!backTo) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      router.replace(backTo);
      return true;
    });
    return () => sub.remove();
  }, [backTo]);

  return (
    <View className={`h-16 flex-row items-center justify-between border-b border-line bg-white ${backTo ? "pl-2 pr-5" : "px-5"}`}>
      {backTo ? (
        <Pressable
          onPress={() => router.replace(backTo)}
          hitSlop={8}
          accessibilityLabel="Kembali"
          className="mr-1 h-11 w-11 items-center justify-center rounded-full active:bg-panel"
        >
          <ChevronLeft size={24} color={colors.ink} />
        </Pressable>
      ) : null}
      <AppText variant="heading" numberOfLines={1} className="mr-3 flex-1 text-xl">
        {title}
      </AppText>
      {right}
    </View>
  );
}
