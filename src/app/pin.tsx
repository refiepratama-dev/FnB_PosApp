import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { BackButton } from "@/components/BackButton";
import { PIN_LENGTH, PinPad } from "@/components/PinPad";
import { getSupabase } from "@/lib/supabase";
import { useOrientation } from "@/lib/orientation";
import { useSession } from "@/store/session";

/** Masukkan PIN owner (dicek ke database) sebelum masuk mode Owner. */
export default function PinScreen() {
  useOrientation("free");
  const setMode = useSession((s) => s.setMode);
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);

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
      await setMode("owner");
      router.replace("/owner/dashboard");
      return;
    }
    setMessage("PIN salah, coba lagi");
    setTimeout(() => setPin(""), 400);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton />
      <View className="flex-1 items-center justify-center px-6">
        <AppText variant="heading" className="text-2xl">
          Masukkan PIN Owner
        </AppText>
        <AppText variant="muted" className={`mb-8 mt-1 ${message ? "text-action" : ""}`}>
          {checking ? "Memeriksa..." : message || "4 digit PIN"}
        </AppText>

        <PinPad value={pin} onChange={onChange} error={message === "PIN salah, coba lagi"} disabled={checking} />

        <Pressable onPress={() => router.push({ pathname: "/login", params: { next: "reset-pin" } })} className="mt-2 p-2">
          <AppText className="text-sm text-brand">Lupa PIN?</AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
