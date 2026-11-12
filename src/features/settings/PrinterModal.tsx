import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { Bluetooth, CheckCircle2, Circle, Printer, RefreshCw } from "lucide-react-native";
import type { PrinterDevice } from "rn-escpos-printer";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { colors } from "@/constants/colors";
import { buildTestPage } from "@/lib/printer/receipt";
import {
  getSavedPrinter,
  isPrinterSupported,
  listPairedPrinters,
  openBluetoothSettings,
  printText,
  getPrintCopies,
  savePrintCopies,
  savePrinter,
  type PrintCopies,
  type SavedPrinter,
} from "@/lib/printer/printer";
import { ensureUsbPermission, isUsbSupported, listUsbPrinters, type UsbPrinterInfo } from "@/lib/printer/usb";
import type { StoreSettings } from "@/types/database";

type Mode = "bluetooth" | "usb";

/** Satu baris pilihan printer (dipakai untuk Bluetooth dan USB). */
type PrinterRow = { key: string; title: string; subtitle: string; active: boolean; onPress: () => void };

const usbId = (p: { vendorId: number; productId: number }) => `usb:${p.vendorId}:${p.productId}`;

/**
 * Setting > Printer: pilih printer lalu tes print.
 * - Bluetooth: printer yang sudah di-pair di Pengaturan Bluetooth.
 * - USB (OTG): printer yang dicolok langsung lewat kabel OTG, izin USB diminta saat dipilih.
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
  const usbAvailable = isUsbSupported();
  const [mode, setMode] = useState<Mode>("bluetooth");
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [usbPrinters, setUsbPrinters] = useState<UsbPrinterInfo[]>([]);
  const [saved, setSaved] = useState<SavedPrinter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const [copies, setCopies] = useState<PrintCopies>("customer");

  useEffect(() => {
    if (visible) getPrintCopies().then(setCopies);
  }, [visible]);

  function chooseCopies(next: PrintCopies) {
    setCopies(next);
    savePrintCopies(next).catch(() => undefined);
  }

  // Saat dibuka, langsung tampilkan tab sesuai printer yang tersimpan
  useEffect(() => {
    if (!visible) return;
    getSavedPrinter().then((s) => {
      if (s?.transport === "usb" && usbAvailable) setMode("usb");
    });
  }, [visible, usbAvailable]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSaved(await getSavedPrinter());
      if (mode === "usb") setUsbPrinters(await listUsbPrinters());
      else setPrinters(await listPairedPrinters());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    if (visible && supported) load();
  }, [visible, supported, load]);

  async function chooseBluetooth(device: PrinterDevice) {
    const next: SavedPrinter = { id: device.id, name: device.name || device.address, transport: "bluetooth" };
    await savePrinter(next);
    setSaved(next);
  }

  async function chooseUsb(device: UsbPrinterInfo) {
    try {
      // dialog izin USB muncul di sini kalau belum pernah diizinkan
      if (!(await ensureUsbPermission(device.vendorId, device.productId))) {
        Alert.alert("Izin USB ditolak", "Pilih printer lagi lalu tekan Izinkan pada dialog yang muncul.");
        return;
      }
      const next: SavedPrinter = {
        id: usbId(device),
        name: device.name,
        transport: "usb",
        vendorId: device.vendorId,
        productId: device.productId,
      };
      await savePrinter(next);
      setSaved(next);
      load();
    } catch (e) {
      Alert.alert("Printer USB gagal dipilih", e instanceof Error ? e.message : String(e));
    }
  }

  async function testPrint() {
    if (!saved) return;
    setTesting(true);
    try {
      await printText(buildTestPage({ name: settings.name }, settings.paper_size, saved.name), saved);
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

  const rows: PrinterRow[] =
    mode === "usb"
      ? usbPrinters.map((p) => ({
          key: usbId(p),
          title: p.name,
          subtitle: `USB ${p.vendorId.toString(16).toUpperCase()}:${p.productId.toString(16).toUpperCase()}${
            p.hasPermission ? "" : " · belum diizinkan"
          }`,
          active: saved?.id === usbId(p),
          onPress: () => chooseUsb(p),
        }))
      : printers.map((p) => ({
          key: p.id,
          title: p.name || "Tanpa nama",
          subtitle: p.address,
          active: saved?.id === p.id,
          onPress: () => chooseBluetooth(p),
        }));

  const emptyText =
    mode === "usb"
      ? "Belum ada printer USB. Colok printer lewat kabel OTG ke tablet / HP, nyalakan printer, lalu tekan Muat ulang."
      : "Belum ada perangkat Bluetooth yang di-pair. Nyalakan printer, lalu pair dulu di Pengaturan Bluetooth.";

  return (
    <AppModal
      visible={visible}
      title="Printer"
      onClose={onClose}
      footer={<Button title="Tes Print" loading={testing} disabled={!saved || testing} onPress={testPrint} />}
    >
      {usbAvailable ? (
        <View className="mb-4 flex-row gap-2">
          <Chip label="Bluetooth" active={mode === "bluetooth"} onPress={() => setMode("bluetooth")} />
          <Chip label="USB (OTG)" active={mode === "usb"} onPress={() => setMode("usb")} />
        </View>
      ) : null}

      {saved ? (
        <AppText variant="muted" className="mb-3 text-xs">
          Printer dipakai: {saved.name} ({saved.transport === "usb" ? "USB" : "Bluetooth"})
        </AppText>
      ) : null}

      <AppText className="mb-2 text-sm">Yang dicetak tiap order</AppText>
      <View className="mb-1 flex-row flex-wrap gap-2">
        <Chip label="Pelanggan saja" active={copies === "customer"} onPress={() => chooseCopies("customer")} />
        <Chip label="Pelanggan + Dapur" active={copies === "customer_kitchen"} onPress={() => chooseCopies("customer_kitchen")} />
      </View>
      <AppText variant="muted" className="mb-4 text-xs">
        {copies === "customer_kitchen"
          ? "Setelah struk pelanggan, tercetak struk dapur (tanpa harga, nomor antrean besar) untuk disobek ke dapur."
          : "Hanya struk pelanggan yang dicetak."}
      </AppText>

      <View className="mb-3 flex-row items-center justify-between">
        <AppText className="text-sm">{mode === "usb" ? "Printer USB yang tercolok" : "Printer yang sudah di-pair"}</AppText>
        <Pressable onPress={load} hitSlop={8} className="flex-row items-center gap-1 p-1">
          <RefreshCw size={16} color={colors.brand} />
          <AppText className="text-sm text-brand">Muat ulang</AppText>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} className="py-6" />
      ) : error ? (
        <AppText className="mb-3 text-sm text-action">{error}</AppText>
      ) : rows.length === 0 ? (
        <AppText variant="muted" className="mb-3 text-sm">
          {emptyText}
        </AppText>
      ) : (
        <View className="mb-3 overflow-hidden rounded-2xl border border-line">
          {rows.map((row, i) => (
            <Pressable
              key={row.key}
              onPress={row.onPress}
              className={`flex-row items-center gap-3 px-4 py-3 active:bg-panel ${i > 0 ? "border-t border-line" : ""} ${
                row.active ? "bg-brand-soft" : "bg-white"
              }`}
            >
              <Printer size={20} color={row.active ? colors.brand : colors.ink} />
              <View className="flex-1">
                <AppText variant={row.active ? "heading" : "body"} numberOfLines={1} className="text-base">
                  {row.title}
                </AppText>
                <AppText variant="muted" className="text-xs">
                  {row.subtitle}
                </AppText>
              </View>
              {row.active ? <CheckCircle2 size={22} color={colors.success} /> : <Circle size={22} color={colors.line} />}
            </Pressable>
          ))}
        </View>
      )}

      {mode === "bluetooth" ? (
        <Button title="Buka Pengaturan Bluetooth" variant="outline" onPress={() => openBluetoothSettings()} />
      ) : null}

      <View className="mt-4 flex-row gap-2 rounded-2xl bg-panel p-3">
        {mode === "usb" ? <Printer size={16} color={colors.inkMuted} /> : <Bluetooth size={16} color={colors.inkMuted} />}
        <AppText variant="muted" className="flex-1 text-xs">
          {mode === "usb"
            ? `Colok kabel OTG dari tablet / HP ke printer. Saat memilih printer, tekan Izinkan (centang "Selalu" supaya tidak ditanya lagi). Cabut dan colok ulang kabel kalau printer tidak muncul. Kertas: ${settings.paper_size} mm (ubah di Struk & Kertas).`
            : `Printer baru: pair dulu di Pengaturan Bluetooth (PIN biasanya 0000 atau 1234), lalu kembali ke sini dan tekan Muat ulang. Kertas: ${settings.paper_size} mm (ubah di Struk & Kertas).`}
        </AppText>
      </View>
    </AppModal>
  );
}
