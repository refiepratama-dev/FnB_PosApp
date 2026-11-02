import { Image, Pressable, ScrollView, View } from "react-native";
import { router, usePathname, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChartColumn,
  LogOut,
  Package,
  ReceiptText,
  Settings,
  ShieldCheck,
  Users,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react-native";
import { AppText } from "./AppText";
import { colors } from "@/constants/colors";
import { useSession } from "@/store/session";

type Item = { label: string; href: Href; icon: LucideIcon };

const ITEMS: Item[] = [
  { label: "Menu", href: "/cashier/menu", icon: UtensilsCrossed },
  { label: "Order", href: "/cashier/orders", icon: ReceiptText },
  { label: "Pengeluaran", href: "/cashier/expenses", icon: Wallet },
  { label: "Stok", href: "/cashier/stock", icon: Package },
  { label: "Report", href: "/cashier/report", icon: ChartColumn },
  { label: "Member", href: "/cashier/members", icon: Users },
  { label: "Setting", href: "/cashier/settings", icon: Settings },
];

/** Satu tombol sidebar: ikon di kiri, teks di sebelah kanan. */
function SidebarButton({
  label,
  icon: Icon,
  active = false,
  danger = false,
  onPress,
}: {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  danger?: boolean;
  onPress: () => void;
}) {
  const iconColor = active ? colors.accent : danger ? colors.action : colors.inkMuted;
  return (
    <Pressable
      onPress={onPress}
      className={`h-11 flex-row items-center gap-3 rounded-full px-4 ${
        active ? "bg-accent-soft" : "active:bg-panel"
      }`}
    >
      <Icon size={20} color={iconColor} />
      <AppText
        numberOfLines={1}
        className={`flex-1 text-sm ${active ? "font-heading text-accent-ink" : danger ? "text-action" : "text-ink-muted"}`}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

/** Sidebar kiri mode Kasir. Menempel ke tepi, dipisah garis tipis (tanpa celah). */
export function CashierSidebar() {
  const pathname = usePathname();
  const setMode = useSession((s) => s.setMode);

  async function exit() {
    await setMode(null);
    router.replace("/start");
  }

  return (
    <SafeAreaView edges={["top", "bottom", "left"]} className="w-48 border-r border-line bg-white">
      {/* Logo */}
      <View className="h-16 flex-row items-center gap-2.5 px-4">
        <Image source={require("../../assets/logo-mark.png")} className="h-8 w-8" resizeMode="contain" />
        <AppText variant="heading" className="text-lg text-navy">
          Teman<AppText variant="heading" className="text-lg text-brand">POS</AppText>
        </AppText>
      </View>
      {/* ScrollView supaya tetap muat di HP landscape yang layarnya pendek */}
      <ScrollView contentContainerClassName="gap-1 px-3 pb-3">
        {ITEMS.map((item) => (
          <SidebarButton
            key={item.label}
            label={item.label}
            icon={item.icon}
            active={pathname === item.href}
            onPress={() => router.replace(item.href)}
          />
        ))}
      </ScrollView>

      <View className="gap-1 border-t border-line px-3 py-3">
        <SidebarButton label="Mode Owner" icon={ShieldCheck} onPress={() => router.push("/pin")} />
        <SidebarButton label="Keluar" icon={LogOut} danger onPress={exit} />
      </View>
    </SafeAreaView>
  );
}
