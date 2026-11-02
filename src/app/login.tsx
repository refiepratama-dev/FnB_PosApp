import { useState } from "react";
import { Image, KeyboardAvoidingView, Pressable, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useOrientation } from "@/lib/orientation";
import { useSession } from "@/store/session";

/**
 * Login akun toko (email + password dari tim TemanPOS).
 * Dipakai juga untuk "Lupa PIN" (?next=reset-pin): login ulang lalu buat PIN baru.
 */
export default function LoginScreen() {
  useOrientation("free");
  const { next } = useLocalSearchParams<{ next?: string }>();
  const isResetPin = next === "reset-pin";
  const signIn = useSession((s) => s.signIn);
  const disconnect = useSession((s) => s.disconnect);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    const message = await signIn(email, password);
    setLoading(false);
    if (message) {
      setError(message);
      return;
    }
    router.replace(isResetPin ? "/pin-reset" : "/start");
  }

  async function changeStore() {
    await disconnect();
    router.replace("/connect");
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {isResetPin ? <BackButton /> : null}
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView contentContainerClassName="flex-grow items-center justify-center px-6 py-8" keyboardShouldPersistTaps="handled">
          <View className="w-full max-w-sm">
            <Image source={require("../../assets/logo-mark.png")} className="mb-4 h-20 w-[72px] self-center" resizeMode="contain" />
            <AppText variant="heading" className="text-center text-2xl">
              {isResetPin ? "Lupa PIN" : "Login Toko"}
            </AppText>
            <AppText variant="muted" className="mb-8 mt-1 text-center">
              {isResetPin ? "Login pakai password toko untuk membuat PIN baru" : "Masukkan email & password dari tim TemanPOS"}
            </AppText>

            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="toko@temanpos.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              className="mb-4"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              onSubmitEditing={submit}
              className="mb-4"
            />

            {error ? <AppText className="mb-4 text-sm text-action">{error}</AppText> : null}

            <Button title="Masuk" loading={loading} disabled={!email || !password} onPress={submit} />

            {!isResetPin ? (
              <Pressable onPress={changeStore} className="mt-6 self-center p-2">
                <AppText variant="muted" className="text-sm">
                  Salah toko? <AppText className="text-sm text-brand">Scan ulang QR</AppText>
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
