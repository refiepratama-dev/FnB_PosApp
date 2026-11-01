import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { Bluetooth, CheckCircle2, Circle, Printer, RefreshCw } from "lucide-react-native";
import type { PrinterDevice } from "rn-escpos-printer";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { colors } from "@/constants/colors";
import { buildTestPage } from "@/lib/printer/receipt";
import {
  getSavedPrinter,
  isPrinterSupported,
  listPairedPrinters,
  openBluetoothSettings,
  printText,
  savePrinter,
  type SavedPrinter,
} from "@/lib/printer/printer";
import type { StoreSettings } from "@/types/database";

/**
 * Setting > Printer: pilih printer Bluetooth yang sudah di-pair, lalu tes print.
 * Printer disimpan per device (tablet kasir bisa beda printer dengan HP owner).
 * Ukuran kertas diatur di Setting > Struk & Kertas.
 */
export function PrinterModal({
  visible,
  settings,
  onClose,
}: {
  visible: boolean;
  settings: StoreSettings;
  onClose: () => void;
}) {
  const supported = isPrinterSupported();
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [saved, setSaved] = useState<SavedPrinter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSaved(await getSavedPrinter());
      setPrinters(await listPairedPrinters());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible && supported) load();
  }, [visible, supported, load]);

  async function choose(device: PrinterDevice) {
    const next = { id: device.id, name: device.name || device.address };
    await savePrinter(next);
    setSaved(next);
  }

  async function testPrint() {
    if (!saved) return;
    setTesting(true);
    try {
      await printText(buildTestPage({ name: settings.name }, settings.paper_size, saved.name), saved.id);
    } catch (e) {
      Alert.alert("Tes print gagal", e instanceof Error ? e.message : String(e));
    } finally {
      setTesting(false);
    }
  }

  if (!supported) {
    return (
      <AppModal visible={visible} title="Printer" onClose={onClose}>
        <AppText variant="muted" className="py-4 text-center">
          Fitur printer hanya jalan di aplikasi TemanPOS (development build / APK), tidak di Expo Go atau web.
        </AppText>
      </AppModal>
    );
  }

  return (
    <AppModal
      visible={visible}
      title="Printer"
      onClose={onClose}
      footer={<Button title="Tes Print" loading={testing} disabled={!saved || testing} onPress={testPrint} />}
    >
      <View className="mb-3 flex-row items-center justify-between">
        <AppText className="text-sm">Printer yang sudah di-pair</AppText>
        <Pressable onPress={load} hitSlop={8} className="flex-row items-center gap-1 p-1">
          <RefreshCw size={16} color={colors.brand} />
          <AppText className="text-sm text-brand">Muat ulang</AppText>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} className="py-6" />
      ) : error ? (
        <AppText className="mb-3 text-sm text-action">{error}</AppText>
      ) : printers.length === 0 ? (
        <AppText variant="muted" className="mb-3 text-sm">
          Belum ada perangkat Bluetooth yang di-pair. Nyalakan printer, lalu pair dulu di Pengaturan Bluetooth.
        </AppText>
      ) : (
        <View className="mb-3 overflow-hidden rounded-2xl border border-line">
          {printers.map((p, i) => {
            const active = saved?.id === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => choose(p)}
                className={`flex-row items-center gap-3 px-4 py-3 active:bg-panel ${i > 0 ? "border-t border-line" : ""} ${
                  active ? "bg-brand-soft" : "bg-white"
                }`}
              >
                <Printer size={20} color={active ? colors.brand : colors.ink} />
                <View className="flex-1">
                  <AppText variant={active ? "heading" : "body"} numberOfLines={1} className="text-base">
                    {p.name || "Tanpa nama"}
                  </AppText>
                  <AppText variant="muted" className="text-xs">
                    {p.address}
                  </AppText>
                </View>
                {active ? <CheckCircle2 size={22} color={colors.success} /> : <Circle size={22} color={colors.line} />}
              </Pressable>
            );
          })}
        </View>
      )}

      <Button title="Buka Pengaturan Bluetooth" variant="outline" onPress={() => openBluetoothSettings()} />

      <View className="mt-4 flex-row gap-2 rounded-2xl bg-panel p-3">
        <Bluetooth size={16} color={colors.inkMuted} />
        <AppText variant="muted" className="flex-1 text-xs">
          Printer baru: pair dulu di Pengaturan Bluetooth (PIN biasanya 0000 atau 1234), lalu kembali ke sini dan tekan
          Muat ulang. Kertas: {settings.paper_size} mm (ubah di Struk & Kertas).
        </AppText>
      </View>
    </AppModal>
  );
}
