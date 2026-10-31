import { useEffect, useState } from "react";
import { View } from "react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { PIN_LENGTH, PinPad } from "@/components/PinPad";
import { getSupabase } from "@/lib/supabase";

/**
 * Minta PIN owner (dicek ke database). Dipakai untuk aksi 🔒 di mode Kasir:
 * hapus member, buka Kelola Produk / Ubah PIN / QR toko di Setting (docs/02-USERS-ROLES.md bagian D).
 */
export function OwnerPinModal({
  visible,
  title = "PIN Owner",
  onVerified,
  onClose,
}: {
  visible: boolean;
  title?: string;
  onVerified: () => void;
  onClose: () => void;
}) {
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (visible) {
      setPin("");
      setMessage("");
      setChecking(false);
    }
  }, [visible]);

  async function onChange(next: string) {
    setPin(next);
    setMessage("");
    if (next.length < PIN_LENGTH) return;

    setChecking(true);
    const { data, error } = await getSupabase().rpc("verify_owner_pin", { p_pin: next });
    setChecking(false);

    if (error) {
      setMessage("Tidak bisa cek PIN. Cek koneksi internet.");
      setPin("");
      return;
    }
    if (data === true) {
      onVerified();
      return;
    }
    setMessage("PIN salah, coba lagi");
    setTimeout(() => setPin(""), 400);
  }

  const wrong = message === "PIN salah, coba lagi";

  return (
    <AppModal visible={visible} title={title} onClose={onClose}>
      <View className="items-center">
        <AppText variant="muted" className={`mb-6 text-center ${message ? "text-action" : ""}`}>
          {checking ? "Memeriksa..." : message || "Aksi ini butuh PIN owner (4 digit)"}
        </AppText>
        <PinPad value={pin} onChange={onChange} error={wrong} disabled={checking} />
      </View>
    </AppModal>
  );
}
