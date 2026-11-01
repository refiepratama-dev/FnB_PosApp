import { useMemo } from "react";
import { Share, View, useWindowDimensions } from "react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { QrCode } from "@/components/QrCode";
import { buildStoreCode } from "@/lib/connection";
import { useSession } from "@/store/session";

/**
 * QR koneksi toko: ditunjukkan ke device baru lewat layar "Hubungkan ke Toko".
 * Isinya sama dengan QR dari tim TemanPOS. Di mode Kasir, popup ini minta PIN owner dulu.
 */
export function StoreQrModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const connection = useSession((s) => s.connection);
  const storeName = useSession((s) => s.storeName);
  const { width, height } = useWindowDimensions();

  const code = useMemo(() => (connection ? buildStoreCode(connection) : null), [connection]);
  const size = Math.max(160, Math.min(280, Math.min(width - 96, height - 220)));

  return (
    <AppModal visible={visible} title="QR Toko" onClose={onClose}>
      {code ? (
        <View className="items-center">
          <AppText variant="heading" className="text-lg">
            {storeName || "Toko"}
          </AppText>
          <AppText variant="muted" className="mb-4 mt-1 text-center text-sm">
            Di device baru, buka layar &quot;Hubungkan ke Toko&quot; lalu scan QR ini.
          </AppText>
          <View className="rounded-3xl border border-line bg-white p-3">
            <QrCode value={code} size={size} />
          </View>
          <AppText className="mb-4 mt-4 text-center text-xs text-action">
            Jangan tunjukkan QR ini ke orang di luar toko.
          </AppText>
          <Button
            title="Bagikan Kode (untuk input manual)"
            variant="outline"
            className="w-full"
            onPress={() => Share.share({ message: code }).catch(() => {})}
          />
        </View>
      ) : (
        <AppText variant="muted" className="py-6 text-center">
          Device ini belum terhubung ke toko.
        </AppText>
      )}
    </AppModal>
  );
}
