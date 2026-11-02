import "../global.css";

import { useEffect } from "react";
import { Stack, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { useMenuRealtime } from "@/hooks/useMenuRealtime";
import { queryClient } from "@/lib/queryClient";
import { useSession } from "@/store/session";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_700Bold });
  const status = useSession((s) => s.status);
  const init = useSession((s) => s.init);

  // Cek koneksi toko & sesi login yang tersimpan di device
  useEffect(() => {
    init();
  }, [init]);

  const ready = fontsLoaded && status !== "loading";

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <LiveData />
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: "none" }} />
    </QueryClientProvider>
  );
}

/** Langganan realtime yang berlaku di seluruh app (setelah login). */
function LiveData() {
  const signedIn = useSession((s) => s.status === "signedIn");
  useMenuRealtime(signedIn);
  return null;
}
