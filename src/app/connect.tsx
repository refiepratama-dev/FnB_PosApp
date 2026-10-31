import { useRef, useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { QrCode } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { colors } from "@/constants/colors";
import { devConnection, parseStoreCode, testConnection, type StoreConnection } from "@/lib/connection";
import { useOrientation } from "@/lib/orientation";
import { useSession } from "@/store/session";

/** Layar pertama di device baru: scan QR toko dari tim TemanPOS. */
export default function ConnectScreen() {
  useOrientation("free");
  const connect = useSession((s) => s.connect);
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const scanning = useRef(false); // cegah QR terbaca berkali-kali
  const dev = devConnection();

  async function applyCode(conn: StoreConnection | null) {
    if (!conn) {
      setError("Ini bukan QR toko TemanPOS");
      return;
    }
    setBusy(true);
    setError("");
    const ok = await testConnection(conn);
    if (!ok) {
      setBusy(false);
      setError("Toko tidak bisa dihubungi. Cek internet atau minta QR baru ke tim TemanPOS.");
      return;
    }
    await connect(conn);
    router.replace("/login");
  }

  async function onScanned(data: string) {
    if (scanning.current || busy) return;
    scanning.current = true;
    await applyCode(parseStoreCode(data));
    // beri jeda sebelum boleh scan lagi kalau gagal
    setTimeout(() => (scanning.current = false), 1500);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="flex-grow items-center justify-center px-6 py-8">
        <View className="w-full max-w-md items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-3xl bg-brand-soft">
            <QrCode size={30} color={colors.brand} />
          </View>
          <AppText variant="heading" className="text-2xl">
            Hubungkan ke Toko
          </AppText>
          <AppText variant="muted" className="mb-6 mt-1 text-center">
            Scan QR toko yang diberikan tim TemanPOS
          </AppText>

          {permission?.granted ? (
            <View className="mb-4 aspect-square w-full max-w-xs overflow-hidden rounded-3xl border-2 border-brand">
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={busy ? undefined : ({ data }) => onScanned(data)}
              />
            </View>
          ) : (
            <Button title="Izinkan Kamera untuk Scan QR" className="mb-4 w-full" onPress={requestPermission} />
          )}

          {error ? <AppText className="mb-4 text-center text-sm text-action">{error}</AppText> : null}
          {busy ? <AppText variant="muted" className="mb-4">Menghubungkan...</AppText> : null}

          {showManual ? (
            <View className="w-full">
              <TextInput
                value={manualCode}
                onChangeText={setManualCode}
                placeholder="Tempel kode toko di sini"
                placeholderTextColor={colors.inkMuted}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
                className="mb-3 min-h-24 rounded-2xl border border-line bg-panel p-4 font-sans text-sm text-ink"
              />
              <Button
                title="Hubungkan"
                loading={busy}
                disabled={!manualCode.trim()}
                onPress={() => applyCode(parseStoreCode(manualCode))}
              />
            </View>
          ) : (
            <Button title="Masukkan kode manual" variant="outline" className="w-full" onPress={() => setShowManual(true)} />
          )}

          {dev ? (
            <Button
              title="Pakai toko development (.env)"
              variant="outline"
              className="mt-3 w-full"
              loading={busy}
              onPress={() => applyCode(dev)}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
