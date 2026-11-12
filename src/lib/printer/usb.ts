import { Platform } from "react-native";
import { requireNativeModule } from "expo";
import { buildUsbPayload, toBase64 } from "./usbBytes";

/**
 * Print lewat kabel USB OTG langsung ke printer (Android saja).
 * Modul native-nya ada di modules/usb-printer. Butuh APK yang dibuild SETELAH modul ini ditambahkan;
 * di Expo Go / web / APK lama, isUsbSupported() bernilai false dan fitur USB tidak muncul.
 */

export type UsbPrinterInfo = {
  vendorId: number;
  productId: number;
  name: string;
  isPrinterClass: boolean;
  hasPermission: boolean;
};

type UsbPrinterNative = {
  isSupported(): boolean;
  listPrinters(): Promise<UsbPrinterInfo[]>;
  requestPermission(vendorId: number, productId: number): Promise<boolean>;
  write(vendorId: number, productId: number, base64: string): Promise<boolean>;
};

let cached: UsbPrinterNative | null | undefined;

/** Ambil modul native secara malas, supaya APK lama / Expo Go / web tidak crash. */
function native(): UsbPrinterNative | null {
  if (cached !== undefined) return cached;
  if (Platform.OS !== "android") {
    cached = null;
    return cached;
  }
  try {
    cached = requireNativeModule<UsbPrinterNative>("UsbPrinter");
  } catch {
    cached = null;
  }
  return cached;
}

/** true kalau modul USB ada di APK ini dan perangkat punya USB host. */
export function isUsbSupported(): boolean {
  try {
    return native()?.isSupported() === true;
  } catch {
    return false;
  }
}

function requireUsb(): UsbPrinterNative {
  const mod = native();
  if (!mod) throw new Error("Fitur printer USB belum ada di aplikasi ini. Pasang APK TemanPOS versi terbaru.");
  return mod;
}

/** Ubah error native jadi pesan bahasa Indonesia (Expo membungkus pesan asli setelah "Caused by:"). */
export function usbErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const inner = message.split("Caused by:").pop()?.trim() ?? message;
  return inner || "Gagal mencetak lewat USB.";
}

/** Printer USB yang sedang tercolok. */
export async function listUsbPrinters(): Promise<UsbPrinterInfo[]> {
  try {
    return await requireUsb().listPrinters();
  } catch (e) {
    throw new Error(usbErrorMessage(e));
  }
}

/** Minta izin USB (dialog Android). true = diizinkan. */
export async function ensureUsbPermission(vendorId: number, productId: number): Promise<boolean> {
  try {
    return await requireUsb().requestPermission(vendorId, productId);
  } catch (e) {
    throw new Error(usbErrorMessage(e));
  }
}

/** Cetak teks struk ke printer USB. Kalau gagal di tengah jalan (kabel goyang), dicoba sekali lagi. */
export async function printUsb(text: string, vendorId: number, productId: number): Promise<void> {
  const mod = requireUsb();
  const payload = toBase64(buildUsbPayload(text));

  const send = async () => {
    if (!(await mod.requestPermission(vendorId, productId))) {
      throw new Error("Izin USB ditolak. Pilih printer USB lagi di Setting > Printer lalu tekan Izinkan.");
    }
    await mod.write(vendorId, productId, payload);
  };

  try {
    await send();
  } catch (first) {
    try {
      await send();
    } catch {
      throw new Error(usbErrorMessage(first));
    }
  }
}
