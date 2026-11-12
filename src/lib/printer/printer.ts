import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking, PermissionsAndroid, Platform, TurboModuleRegistry } from "react-native";
import type { PrinterDevice } from "rn-escpos-printer";
import { isUsbSupported, printUsb } from "./usb";

/**
 * Sambungan ke printer thermal Bluetooth (pakai library rn-escpos-printer).
 *
 * - Android hanya melihat printer yang SUDAH DI-PAIR di Pengaturan Bluetooth HP/tablet.
 * - Printer yang dipilih disimpan di device ini saja (AsyncStorage), bukan di database,
 *   karena tiap tablet bisa punya printer sendiri.
 * - Tidak jalan di Expo Go / web: perlu development build (lihat docs).
 */

export type PrinterTransport = "bluetooth" | "usb";

/**
 * Printer yang dipilih di device ini.
 * transport kosong = Bluetooth (data lama sebelum ada USB). Untuk USB, id berisi "usb:vendor:product".
 */
export type SavedPrinter = {
  id: string;
  name: string;
  transport?: PrinterTransport;
  vendorId?: number;
  productId?: number;
};

const STORAGE_KEY = "temanpos.printer";

type EscPosModule = typeof import("rn-escpos-printer").EscPosPrinter;
let cached: EscPosModule | null | undefined;

/** Ambil modul native secara malas, supaya Expo Go / web tidak crash saat aplikasi dibuka. */
function native(): EscPosModule | null {
  if (cached !== undefined) return cached;
  if (!TurboModuleRegistry.get("RnEscposPrinter")) {
    cached = null;
    return cached;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = (require("rn-escpos-printer") as typeof import("rn-escpos-printer")).EscPosPrinter;
  } catch {
    cached = null;
  }
  return cached;
}

/** true kalau aplikasi ini bisa mencetak lewat Bluetooth atau USB (development build / APK, bukan Expo Go / web). */
export function isPrinterSupported(): boolean {
  return Platform.OS !== "web" && (native() !== null || isUsbSupported());
}

function requireNative(): EscPosModule {
  const mod = native();
  if (!mod) throw new Error("Fitur printer tidak tersedia di Expo Go. Pakai aplikasi TemanPOS (development build).");
  return mod;
}

/** Minta izin "Perangkat di sekitar" (Android 12+). Mengembalikan true kalau diizinkan. */
export async function ensureBluetoothPermission(): Promise<boolean> {
  if (Platform.OS !== "android" || Number(Platform.Version) < 31) return true;
  const permission = PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT;
  if (await PermissionsAndroid.check(permission)) return true;
  const result = await PermissionsAndroid.request(permission, {
    title: "Izin Bluetooth",
    message: "TemanPOS butuh izin Perangkat di sekitar untuk tersambung ke printer struk.",
    buttonPositive: "Izinkan",
    buttonNegative: "Nanti",
  });
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

let initialized = false;
async function ready(): Promise<EscPosModule> {
  const mod = requireNative();
  if (!(await ensureBluetoothPermission())) {
    throw new Error("Izin Bluetooth ditolak. Buka Pengaturan aplikasi TemanPOS > Izin > Perangkat di sekitar.");
  }
  if (!initialized) {
    await mod.initialize();
    initialized = true;
  }
  return mod;
}

/** Daftar printer yang sudah di-pair di Pengaturan Bluetooth. */
export async function listPairedPrinters(): Promise<PrinterDevice[]> {
  const mod = await ready();
  try {
    return await mod.getPrinters();
  } catch (e) {
    throw new Error(printerErrorMessage(e));
  }
}

export async function getSavedPrinter(): Promise<SavedPrinter | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedPrinter) : null;
  } catch {
    return null;
  }
}

export async function savePrinter(printer: SavedPrinter | null): Promise<void> {
  if (printer) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(printer));
  else await AsyncStorage.removeItem(STORAGE_KEY);
  // printer diganti -> putuskan sambungan lama
  const mod = native();
  if (mod && initialized) await mod.disconnect().catch(() => undefined);
}

let connectedId: string | null = null;

/** Sambungkan ke printer (kalau belum tersambung ke printer yang sama). */
async function connectTo(mod: EscPosModule, printerId: string): Promise<void> {
  if (connectedId === printerId && (await mod.isConnected().catch(() => false))) return;
  await mod.disconnect().catch(() => undefined);
  await mod.connect(printerId, { timeoutMs: 10_000 });
  connectedId = printerId;
}

/** Cetak lewat Bluetooth. Kalau sambungan putus di tengah jalan (printer sempat mati), dicoba sekali lagi. */
async function printBluetooth(text: string, printerId: string): Promise<void> {
  const mod = await ready();

  const send = async () => {
    await connectTo(mod, printerId);
    await mod.printText(text, { codePage: "cp850", feedLines: 4, cut: true });
  };

  try {
    await send();
  } catch (first) {
    connectedId = null;
    try {
      await send();
    } catch {
      throw new Error(printerErrorMessage(first));
    }
  }
}

/**
 * Cetak teks (hasil buildReceipt / buildTestPage) ke printer.
 * target kosong -> pakai printer yang tersimpan di Setting.
 * target string -> id printer Bluetooth (cara lama). target objek -> printer apa saja (Bluetooth / USB).
 * Printer USB dikirim lewat kabel OTG, printer Bluetooth lewat library rn-escpos-printer.
 */
export async function printText(text: string, target?: string | SavedPrinter): Promise<void> {
  let printer: SavedPrinter | null;
  if (typeof target === "object") {
    printer = target;
  } else {
    const saved = await getSavedPrinter();
    printer = target ? (saved && saved.id === target ? saved : { id: target, name: target }) : saved;
  }
  if (!printer) throw new Error("Printer belum dipilih. Buka Setting > Printer.");

  if (printer.transport === "usb") {
    if (printer.vendorId === undefined || printer.productId === undefined) {
      throw new Error("Data printer USB tidak lengkap. Pilih printer USB lagi di Setting > Printer.");
    }
    await printUsb(text, printer.vendorId, printer.productId);
    return;
  }
  await printBluetooth(text, printer.id);
}

/** Buka halaman Pengaturan Bluetooth Android (untuk pairing printer baru). */
export async function openBluetoothSettings(): Promise<void> {
  if (Platform.OS === "android") {
    try {
      await Linking.sendIntent("android.settings.BLUETOOTH_SETTINGS");
      return;
    } catch {
      // jatuh ke pengaturan aplikasi
    }
  }
  await Linking.openSettings();
}

/** Ubah kode error library jadi pesan bahasa Indonesia. */
export function printerErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
  const message = error instanceof Error ? error.message : String(error);
  const text = `${code} ${message}`;
  if (/BLUETOOTH_DISABLED/i.test(text)) return "Bluetooth mati. Nyalakan Bluetooth dulu.";
  if (/BLUETOOTH_PERMISSION/i.test(text)) return "Izin Bluetooth belum diberikan.";
  if (/PRINTER_NOT_FOUND/i.test(text)) return "Printer tidak ditemukan. Pastikan sudah di-pair di Pengaturan Bluetooth.";
  if (/CONNECTION_TIMEOUT|CONNECTION_FAILED/i.test(text)) {
    return "Tidak bisa tersambung ke printer. Pastikan printer menyala, dekat, dan tidak sedang dipakai HP lain.";
  }
  if (/CONNECTION_LOST|WRITE_FAILED|NOT_CONNECTED/i.test(text)) return "Sambungan ke printer terputus. Coba cetak lagi.";
  return message || "Gagal mencetak.";
}
