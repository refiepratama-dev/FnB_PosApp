import { useEffect, useState } from "react";
import { View } from "react-native";
import { Check } from "lucide-react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { PIN_LENGTH, PinPad } from "@/components/PinPad";
import { errorMessage } from "@/lib/errors";
import { getSupabase } from "@/lib/supabase";
import { colors } from "@/constants/colors";

type Step = "old" | "new" | "confirm" | "done";

const STEP_TITLE: Record<Exclude<Step, "done">, string> = {
  old: "Masukkan PIN lama",
  new: "Masukkan PIN baru",
  confirm: "Ulangi PIN baru",
};
const STEP_NUMBER: Record<Exclude<Step, "done">, number> = { old: 1, new: 2, confirm: 3 };

/**
 * Ubah PIN owner: PIN lama -> PIN baru -> ulangi PIN baru.
 * Bisa dibuka dari mode mana pun (Owner atau Kasir). PIN baru berlaku di SEMUA device.
 *
 *   <ChangePinModal visible={open} onClose={() => setOpen(false)} />
 *
 * Catatan: di mode Kasir, menu "Ubah PIN" tetap minta PIN owner dulu lewat <OwnerPinModal>
 * sebelum popup ini dibuka (dipasang di halaman Setting).
 */
export function ChangePinModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [step, setStep] = useState<Step>("old");
  const [pin, setPin] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Mulai dari awal setiap kali popup dibuka
  useEffect(() => {
    if (!visible) return;
    setStep("old");
    setPin("");
    setOldPin("");
    setNewPin("");
    setMessage("");
    setBusy(false);
  }, [visible]);

  /** Tampilkan pesan salah, lalu kosongkan titik PIN sebentar kemudian. */
  function reject(text: string) {
    setMessage(text);
    setTimeout(() => setPin(""), 400);
  }

  async function onChange(next: string) {
    if (busy || step === "done") return;
    setPin(next);
    setMessage("");
    if (next.length < PIN_LENGTH) return;

    if (step === "old") {
      setBusy(true);
      const { data, error } = await getSupabase().rpc("verify_owner_pin", { p_pin: next });
      setBusy(false);
      if (error) {
        setPin("");
        setMessage("Tidak bisa cek PIN. Cek koneksi internet.");
      } else if (data === true) {
        setOldPin(next);
        setPin("");
        setStep("new");
      } else {
        reject("PIN lama salah, coba lagi");
      }
      return;
    }

    if (step === "new") {
      if (next === oldPin) {
        reject("PIN baru harus berbeda dari PIN lama");
        return;
      }
      setNewPin(next);
      setPin("");
      setStep("confirm");
      return;
    }

    // step === "confirm"
    if (next !== newPin) {
      setPin("");
      setNewPin("");
      setStep("new");
      setMessage("PIN tidak sama. Masukkan PIN baru lagi.");
      return;
    }

    setBusy(true);
    const { data, error } = await getSupabase().rpc("change_owner_pin", { p_old_pin: oldPin, p_new_pin: next });
    setBusy(false);

    if (error) {
      setPin("");
      setNewPin("");
      setStep("new");
      setMessage(errorMessage(error));
    } else if (data === true) {
      setStep("done");
    } else {
      // PIN lama sudah berubah (misal diganti dari device lain) -> mulai dari awal
      setPin("");
      setOldPin("");
      setNewPin("");
      setStep("old");
      setMessage("PIN lama sudah tidak berlaku. Mulai dari awal.");
    }
  }

  if (step === "done") {
    return (
      <AppModal visible={visible} title="Ubah PIN" onClose={onClose}>
        <View className="items-center py-4">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-success">
            <Check size={44} color={colors.white} strokeWidth={3} />
          </View>
          <AppText variant="heading" className="text-xl">
            PIN berhasil diubah
          </AppText>
          <AppText variant="muted" className="mb-6 mt-1 text-center">
            PIN baru berlaku di semua device.
          </AppText>
          <Button title="Selesai" onPress={onClose} className="self-stretch" />
        </View>
      </AppModal>
    );
  }

  const wrong = message === "PIN lama salah, coba lagi" || message === "PIN baru harus berbeda dari PIN lama";

  return (
    <AppModal visible={visible} title="Ubah PIN" onClose={onClose}>
      <View className="items-center">
        <AppText variant="muted" className="text-xs">
          Langkah {STEP_NUMBER[step]} dari 3
        </AppText>
        <AppText variant="heading" className="mt-1 text-lg">
          {STEP_TITLE[step]}
        </AppText>
        <AppText variant="muted" className={`mb-6 mt-1 text-center ${message ? "text-action" : ""}`}>
          {busy ? "Memeriksa..." : message || "4 digit angka"}
        </AppText>
        <PinPad value={pin} onChange={onChange} error={wrong} disabled={busy} />
      </View>
    </AppModal>
  );
}
