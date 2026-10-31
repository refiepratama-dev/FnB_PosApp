import { ActivityIndicator, View } from "react-native";
import { WifiOff } from "lucide-react-native";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { colors } from "@/constants/colors";
import { errorMessage } from "@/lib/errors";

/**
 * Tampilkan loading / error untuk hasil useQuery.
 *
 *   const query = useMenuItems();
 *   if (query.isLoading || query.error) return <QueryState query={query} />;
 */
export function QueryState({ query }: { query: { isLoading: boolean; error: unknown; refetch: () => unknown } }) {
  if (query.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }
  return (
    <View className="flex-1 items-center justify-center gap-2 p-8">
      <WifiOff size={28} color={colors.inkMuted} />
      <AppText variant="heading" className="text-center">
        Gagal memuat data
      </AppText>
      <AppText variant="muted" className="text-center">
        {errorMessage(query.error)}
      </AppText>
      <Button title="Coba lagi" variant="outline" className="mt-3" onPress={() => query.refetch()} />
    </View>
  );
}
