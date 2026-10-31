import { Redirect } from "expo-router";
import { useSession } from "@/store/session";

/**
 * Pintu masuk app. Arahkan ke layar yang tepat:
 * belum terhubung toko -> Hubungkan ke Toko
 * belum login         -> Login
 * ada mode terakhir   -> langsung ke mode itu (tanpa PIN)
 * selain itu          -> Layar Awal
 */
export default function Index() {
  const status = useSession((s) => s.status);
  const mode = useSession((s) => s.mode);

  if (status === "noStore") return <Redirect href="/connect" />;
  if (status === "signedOut") return <Redirect href="/login" />;
  if (mode === "cashier") return <Redirect href="/cashier/menu" />;
  if (mode === "owner") return <Redirect href="/owner/dashboard" />;
  return <Redirect href="/start" />;
}
