import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { PIN_LENGTH, PinPad } from "@/components/PinPad";
import { errorMessage } from "@/lib/errors";
import { getSupabase } from "@/lib/supabase";

type Step = "old" | "new" | "confirm";

const TITLE: Record<Step, string> = {
  old: "Masukkan PIN lama",
  new: "Masukkan PIN baru",
  confirm: "Ulangi PIN baru",
};

/**
 * Ubah PIN owner (dari mode mana pun): PIN lama -> PIN baru -> ulangi PIN baru.
 * Dicek & disimpan lewat fungsi database verify_owner_pin / change_owner_pin.
 * PIN berlaku di semua device toko. Di mode Kasir, popup ini baru dibuka setelah PIN owner benar.
 */
export function ChangePinModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [step, setStep] = useState<Step>("old");
  const [pin, setPin] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setStep("old");
    setPin("");
    setOldPin("");
    setNewPin("");
    setMessage("");
    setBusy(false);
  }

  useEffect(() => {
    if (visible) reset();
  }, [visible]);

  const clearSoon = (ms = 150) => setTimeout(() => setPin(""), ms);

  async function onChange(next: string) {
    setPin(next);
    setMessage("");
    if (next.length < PIN_LENGTH) return;

    if (step === "old") {
      setBusy(true);
      const { data, error } = await getSupabase().rpc("verify_owner_pin", { p_pin: next });
      setBusy(false);
      if (error) {
        setMessage("Tidak bisa cek PIN. Cek koneksi internet.");
        setPin("");
        return;
      }
      if (data !== true) {
        setMessage("PIN lama salah, coba lagi");
        clearSoon(400);
        return;
      }
      setOldPin(next);
      setStep("new");
      clearSoon();
      return;
    }

    if (step === "new") {
      if (next === oldPin) {
        setMessage("PIN baru harus berbeda dari PIN lama");
        clearSoon(600);
        return;
      }
      setNewPin(next);
      setStep("confirm");
      clearSoon();
      return;
    }

    // step === "confirm"
    if (next !== newPin) {
      setMessage("PIN tidak sama. Masukkan PIN baru lagi.");
      setTimeout(() => {
        setStep("new");
        setNewPin("");
        setPin("");
      }, 700);
      return;
    }

    setBusy(true);
    const { data, error } = await getSupabase().rpc("change_owner_pin", { p_old_pin: oldPin, p_new_pin: next });
    setBusy(false);
    if (error) {
      reset();
      setMessage(errorMessage(error));
      return;
    }
    if (data !== true) {
      // PIN lama sudah berubah dari device lain
      reset();
      setMessage("PIN lama tidak cocok. Ulangi dari awal.");
      return;
    }
    onClose();
    Alert.alert("PIN berhasil diubah", "PIN baru berlaku di semua device toko.");
  }

  return (
    <AppModal visible={visible} title="Ubah PIN" onClose={onClose}>
      <View className="items-center">
        <AppText variant="heading" className="text-lg">
          {TITLE[step]}
        </AppText>
        <AppText variant="muted" className={`mb-6 mt-1 text-center ${message ? "text-action" : ""}`}>
          {busy ? "Memeriksa..." : message || "4 digit angka"}
        </AppText>
        <PinPad value={pin} onChange={onChange} error={!!message} disabled={busy} />
      </View>
    </AppModal>
  );
}
