import Constants from "expo-constants";
import * as Updates from "expo-updates";

/**
 * Info pembaruan aplikasi (OTA lewat EAS Update).
 * Dipakai oleh Setting > Perbarui Aplikasi (features/settings/UpdateModal.tsx).
 *
 * Catatan: pembaruan hanya aktif di APK hasil build `preview` / `production`.
 * Di mode development (Expo Go / dev client), `Updates.isEnabled` bernilai false.
 */
export type AppUpdateInfo = {
  enabled: boolean;
  version: string; // versi dari app.json (juga dipakai sebagai runtimeVersion)
  channel: string; // preview / production / "-" kalau tidak ada
  updateLabel: string; // "Bawaan APK" atau 8 huruf pertama ID update yang sedang jalan
  createdAt: Date | null; // kapan update yang sedang jalan dibuat
};

/** ID update panjang -> 8 huruf pertama. Update bawaan APK tidak punya waktu pembuatan. */
export function shortUpdateId(updateId: string | null | undefined, embedded: boolean): string {
  if (embedded || !updateId) return "Bawaan APK";
  return updateId.slice(0, 8);
}

export function getAppUpdateInfo(): AppUpdateInfo {
  const embedded = Updates.isEmbeddedLaunch === true;
  return {
    enabled: Updates.isEnabled === true,
    version: Constants.expoConfig?.version ?? "-",
    channel: Updates.channel ?? "-",
    updateLabel: shortUpdateId(Updates.updateId, embedded),
    createdAt: embedded ? null : (Updates.createdAt ?? null),
  };
}

/** Cek ke server: apakah ada update baru untuk channel & versi aplikasi ini? */
export async function checkAppUpdate(): Promise<boolean> {
  const result = await Updates.checkForUpdateAsync();
  return result.isAvailable;
}

/** Unduh update ke HP. true = ada update baru yang siap dipasang (tinggal mulai ulang). */
export async function downloadAppUpdate(): Promise<boolean> {
  const result = await Updates.fetchUpdateAsync();
  return result.isNew;
}

/** Mulai ulang aplikasi supaya update yang sudah diunduh dipakai. */
export async function restartApp(): Promise<void> {
  await Updates.reloadAsync();
}
