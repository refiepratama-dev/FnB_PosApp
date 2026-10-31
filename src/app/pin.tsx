import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Delete } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { colors } from "@/constants/colors";
import { useOrientation } from "@/lib/orientation";

const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

// TODO (langkah berikutnya): cek PIN ke database Supabase (hash), bukan angka tetap.
const TEMP_PIN = "0000";

/** Masukkan PIN owner (4 digit) sebelum masuk mode Owner. */
export default function PinScreen() {
  useOrientation("free");
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  function press(key: string) {
    if (key === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= PIN_LENGTH) return;

    const next = pin + key;
    setPin(next);
    setError(false);

    if (next.length === PIN_LENGTH) {
      if (next === TEMP_PIN) {
        router.replace("/owner/dashboard");
      } else {
        setError(true);
        setTimeout(() => setPin(""), 400);
      }
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Pressable onPress={() => router.back()} className="m-4 h-11 w-11 items-center justify-center rounded-full bg-panel">
        <ChevronLeft size={22} color={colors.ink} />
      </Pressable>

      <View className="flex-1 items-center justify-center px-6">
        <AppText variant="heading" className="text-2xl">
          Masukkan PIN Owner
        </AppText>
        <AppText variant="muted" className="mt-1">
          {error ? "PIN salah, coba lagi" : "4 digit PIN"}
        </AppText>

        <View className="my-8 flex-row gap-4">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              className={`h-4 w-4 rounded-full ${
                error ? "bg-action" : i < pin.length ? "bg-brand" : "bg-line"
              }`}
            />
          ))}
        </View>

        <View className="w-full max-w-xs flex-row flex-wrap justify-between">
          {KEYS.map((key, i) =>
            key === "" ? (
              <View key={i} className="mb-3 h-16 w-[30%]" />
            ) : (
              <Pressable
                key={i}
                onPress={() => press(key)}
                className="mb-3 h-16 w-[30%] items-center justify-center rounded-2xl bg-panel active:bg-brand-soft"
              >
                {key === "del" ? (
                  <Delete size={24} color={colors.ink} />
                ) : (
                  <AppText variant="heading" className="text-2xl">
                    {key}
                  </AppText>
                )}
              </Pressable>
            ),
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
