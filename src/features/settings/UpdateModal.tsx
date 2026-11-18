import { useEffect, useState } from "react";
import { View } from "react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { checkAppUpdate, downloadAppUpdate, getAppUpdateInfo, restartApp } from "@/lib/appUpdate";
import { errorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

type Phase = "idle" | "checking" | "none" | "available" | "downloading" | "ready" | "error";

const STATUS: Record<Exclude<Phase, "error">, string> = {
  idle: "Ketuk tombol di bawah untuk mencari versi terbaru.",
  checking: "Memeriksa pembaruan...",
  none: "Aplikasi sudah versi terbaru.",
  available: "Ada pembaruan baru. Unduh dulu, lalu aplikasi dimulai ulang untuk memakainya.",
  downloading: "Mengunduh pembaruan. Jangan tutup aplikasi...",
  ready: "Pembaruan siap dipasang. Selesaikan dulu order yang sedang dibuat, karena aplikasi akan dimulai ulang. Login tetap aman.",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 py-2">
      <AppText variant="muted" className="text-sm">
        {label}
      </AppText>
      <AppText className="flex-1 text-right text-sm">{value}</AppText>
    </View>
  );
}

/**
 * Setting > Perbarui Aplikasi: update OTA langsung dari aplikasi (EAS Update), tanpa install APK baru.
 * Alur: popup dibuka -> otomatis cek -> (ada update) Unduh -> Mulai Ulang & Pasang.
 * Hanya mengganti kode JS / tampilan. Perubahan native tetap butuh APK baru (lihat docs/09-QUALITY-RELEASE.md).
 */
export function UpdateModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const info = getAppUpdateInfo();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");

  async function check() {
    setPhase("checking");
    setError("");
    try {
      setPhase((await checkAppUpdate()) ? "available" : "none");
    } catch (e) {
      setError(errorMessage(e));
      setPhase("error");
    }
  }

  async function download() {
    setPhase("downloading");
    setError("");
    try {
      setPhase((await downloadAppUpdate()) ? "ready" : "none");
    } catch (e) {
      setError(errorMessage(e));
      setPhase("error");
    }
  }

  async function restart() {
    try {
      await restartApp();
    } catch (e) {
      setError(errorMessage(e));
      setPhase("error");
    }
  }

  // Cek otomatis setiap kali popup dibuka (kalau pembaruan aktif di build ini)
  useEffect(() => {
    if (!visible) return;
    setError("");
    if (getAppUpdateInfo().enabled) check();
    else setPhase("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const busy = phase === "checking" || phase === "downloading";

  let action = <Button title="Cek Pembaruan" variant="outline" loading={busy} onPress={check} />;
  if (phase === "checking") action = <Button title="Memeriksa..." loading onPress={check} />;
  if (phase === "available") action = <Button title="Unduh Pembaruan" onPress={download} />;
  if (phase === "downloading") action = <Button title="Mengunduh..." loading onPress={download} />;
  if (phase === "ready") action = <Button title="Mulai Ulang & Pasang" variant="pay" onPress={restart} />;

  return (
    <AppModal visible={visible} title="Perbarui Aplikasi" onClose={onClose} footer={info.enabled ? action : undefined}>
      <View className="mb-4 rounded-2xl border border-line bg-panel px-4 py-2">
        <InfoRow label="Versi aplikasi" value={info.version} />
        <InfoRow label="Saluran update" value={info.channel} />
        <InfoRow label="Update terpasang" value={info.updateLabel} />
        {info.createdAt ? <InfoRow label="Dibuat" value={formatDateTime(info.createdAt)} /> : null}
      </View>

      {info.enabled ? (
        <AppText className={`text-sm ${phase === "error" ? "text-action" : ""}`}>
          {phase === "error" ? `Gagal: ${error}` : STATUS[phase]}
        </AppText>
      ) : (
        <AppText variant="muted" className="text-sm">
          Pembaruan lewat aplikasi tidak aktif di build ini (mode development). Gunakan APK dari build preview atau
          production.
        </AppText>
      )}
    </AppModal>
  );
}
