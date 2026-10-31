import { Pressable, View } from "react-native";
import { router, usePathname, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChartColumn,
  LayoutDashboard,
  ReceiptText,
  Settings,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react-native";
import { AppText } from "./AppText";
import { colors } from "@/constants/colors";

type Item = { label: string; href: Href; icon: LucideIcon };

const ITEMS: Item[] = [
  { label: "Dashboard", href: "/owner/dashboard", icon: LayoutDashboard },
  { label: "Order", href: "/owner/orders", icon: ReceiptText },
  { label: "Laporan", href: "/owner/report", icon: ChartColumn },
  { label: "Menu", href: "/owner/products", icon: UtensilsCrossed },
  { label: "Setting", href: "/owner/settings", icon: Settings },
];

/** Navbar bawah mode Owner. */
export function OwnerTabBar() {
  const pathname = usePathname();

  return (
    <SafeAreaView edges={["bottom"]} className="border-t border-line bg-white">
      <View className="flex-row py-2">
        {ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Pressable key={label} onPress={() => router.replace(href)} className="flex-1 items-center py-1">
              <Icon size={22} color={active ? colors.brand : colors.inkMuted} />
              <AppText className={`mt-1 text-xs ${active ? "font-heading text-brand" : "text-ink-muted"}`}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
