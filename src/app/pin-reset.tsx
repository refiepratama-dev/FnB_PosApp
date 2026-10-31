import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { BackButton } from "@/components/BackButton";
import { PIN_LENGTH, PinPad } from "@/components/PinPad";
import { getSupabase } from "@/lib/supabase";
import { useOrientation } from "@/lib/orientation";
import { useSession } from "@/store/session";

/** Buat PIN baru setelah "Lupa PIN" (wajib login password dulu, dicek di database). */
export default function PinResetScreen() {
  useOrientation("free");
  const setMode = useSession((s) => s.setMode);
  const [first, setFirst] = useState(""); // PIN baru (langkah 1)
  const [pin, setPin] = useState(""); // isian saat ini
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const confirming = first.length === PIN_LENGTH;

  async function onChange(next: string) {
    setPin(next);
    setMessage("");
    if (next.length < PIN_LENGTH) return;

    if (!confirming) {
      setFirst(next);
      setTimeout(() => setPin(""), 150);
      return;
    }

    if (next !== first) {
      setMessage("PIN tidak sama. Ulangi dari awal.");
      setTimeout(() => {
        setFirst("");
        setPin("");
      }, 600);
      return;
    }

    setSaving(true);
    const { error } = await getSupabase().rpc("reset_owner_pin", { p_new_pin: next });
    setSaving(false);
    if (error) {
      setMessage(error.message);
      setFirst("");
      setPin("");
      return;
    }
    await setMode("owner");
    router.replace("/owner/dashboard");
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton onPress={() => router.replace("/start")} />
      <View className="flex-1 items-center justify-center px-6">
        <AppText variant="heading" className="text-2xl">
          {confirming ? "Ulangi PIN Baru" : "Buat PIN Baru"}
        </AppText>
        <AppText variant="muted" className={`mb-8 mt-1 text-center ${message ? "text-action" : ""}`}>
          {saving ? "Menyimpan..." : message || "PIN ini berlaku di semua device toko"}
        </AppText>
        <PinPad value={pin} onChange={onChange} error={!!message} disabled={saving} />
      </View>
    </SafeAreaView>
  );
}
