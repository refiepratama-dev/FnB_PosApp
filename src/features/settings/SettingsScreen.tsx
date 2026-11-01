import { useState } from "react";
import { Alert, View } from "react-native";
import { router } from "expo-router";
import { Bike, Percent, QrCode, ReceiptText, ShieldCheck, UtensilsCrossed } from "lucide-react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SettingsList, type SettingItem } from "@/components/SettingsList";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useSession } from "@/store/session";
import { ChangePinModal } from "./ChangePinModal";
import { OjolMarkupModal } from "./OjolMarkupModal";
import { ReceiptModal } from "./ReceiptModal";
import { StoreQrModal } from "./StoreQrModal";
import { TaxServiceModal } from "./TaxServiceModal";

type Panel = "tax" | "ojol" | "receipt" | "pin" | "qr" | null;

/**
 * Setting (sama untuk Owner & Kasir): pajak & service, persen harga ojol, struk & kertas,
 * kelola produk, ubah PIN, QR toko, logout.
 * Menu bertanda ownerOnly (Kelola Produk, Ubah PIN, QR Toko) tetap tampil di mode Kasir,
 * tapi minta PIN owner dulu saat ditap (diurus oleh SettingsList).
 * Penanggung jawab: Fahri (lihat docs/CODING-GUIDE.md)
 */
export default function SettingsScreen() {
  const mode = useSession((s) => s.mode);
  const query = useStoreSettings();
  const settings = query.data;
  const [panel, setPanel] = useState<Panel>(null);

  /** Popup yang butuh data pengaturan: kalau belum termuat (misal internet mati), beri tahu. */
  function openWithSettings(next: Exclude<Panel, null>) {
    if (!settings) {
      Alert.alert("Pengaturan belum termuat", "Cek koneksi internet, lalu coba lagi.");
      query.refetch();
      return;
    }
    setPanel(next);
  }

  const items: SettingItem[] = [
    { label: "Pajak & Service", icon: Percent, onPress: () => openWithSettings("tax") },
    { label: "Harga Ojol", icon: Bike, onPress: () => openWithSettings("ojol") },
    { label: "Struk & Kertas", icon: ReceiptText, onPress: () => openWithSettings("receipt") },
    {
      label: "Kelola Produk",
      icon: UtensilsCrossed,
      ownerOnly: true,
      onPress: () => router.push(mode === "cashier" ? "/cashier/products" : "/owner/products"),
    },
    { label: "Ubah PIN", icon: ShieldCheck, ownerOnly: true, onPress: () => setPanel("pin") },
    { label: "QR Toko", icon: QrCode, ownerOnly: true, onPress: () => setPanel("qr") },
  ];

  const close = () => setPanel(null);

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Setting" />
      <SettingsList items={items} />

      {settings ? (
        <>
          <TaxServiceModal visible={panel === "tax"} settings={settings} onClose={close} />
          <OjolMarkupModal visible={panel === "ojol"} settings={settings} onClose={close} />
          <ReceiptModal visible={panel === "receipt"} settings={settings} onClose={close} />
        </>
      ) : null}
      <ChangePinModal visible={panel === "pin"} onClose={close} />
      <StoreQrModal visible={panel === "qr"} onClose={close} />
    </View>
  );
}
