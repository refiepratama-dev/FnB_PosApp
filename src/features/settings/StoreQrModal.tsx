import { useMemo } from "react";
import { View, useWindowDimensions } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { buildStoreCode } from "@/lib/connection";
import { useSession } from "@/store/session";
import { encodeQr, qrToPath } from "./qr";

/**
 * Tampilkan QR toko supaya device lain bisa terhubung (layar "Hubungkan ke Toko" > scan QR).
 * Isi QR dari buildStoreCode() di "@/lib/connection" (alamat project + anon key toko ini).
 *
 *   <StoreQrModal visible={open} onClose={() => setOpen(false)} />
 *
 * Catatan: di mode Kasir, menu "QR toko" tetap minta PIN owner dulu lewat <OwnerPinModal>
 * sebelum popup ini dibuka (dipasang di halaman Setting).
 */
export function StoreQrModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const connection = useSession((s) => s.connection);
  const storeName = useSession((s) => s.storeName);
  const { width, height } = useWindowDimensions();

  // QR dibuat hanya saat popup dibuka
  const qr = useMemo(() => {
    if (!visible || !connection) return null;
    try {
      return qrToPath(encodeQr(buildStoreCode(connection)));
    } catch {
      return null;
    }
  }, [visible, connection]);

  // Cukup besar untuk discan, tapi tetap muat di HP landscape
  const side = Math.max(200, Math.min(320, width - 96, height - 280));

  return (
    <AppModal
      visible={visible}
      title="QR Toko"
      onClose={onClose}
      footer={<Button title="Tutup" variant="outline" onPress={onClose} />}
    >
      {qr ? (
        <View className="items-center">
          {storeName ? (
            <AppText variant="heading" className="mb-3 text-center text-lg" numberOfLines={2}>
              {storeName}
            </AppText>
          ) : null}

          {/* Latar putih + tepi putih (quiet zone) wajib supaya mudah discan, juga di mode gelap */}
          <View className="rounded-2xl border border-line bg-white p-2">
            <Svg width={side} height={side} viewBox={`0 0 ${qr.size} ${qr.size}`}>
              <Rect x={0} y={0} width={qr.size} height={qr.size} fill="#FFFFFF" />
              <Path d={qr.path} fill="#000000" />
            </Svg>
          </View>

          <AppText variant="muted" className="mt-4 text-center text-sm">
            Di device lain, buka layar Hubungkan ke Toko lalu scan QR ini.
          </AppText>
          <AppText variant="muted" className="mt-2 text-center text-xs">
            QR ini memberi akses untuk menghubungkan device ke toko. Jangan dibagikan ke orang yang tidak berkepentingan.
          </AppText>
        </View>
      ) : (
        <AppText variant="muted" className="py-8 text-center">
          {connection ? "QR toko gagal dibuat." : "Device ini belum terhubung ke toko."}
        </AppText>
      )}
    </AppModal>
  );
}
