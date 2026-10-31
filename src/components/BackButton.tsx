import { Pressable } from "react-native";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { colors } from "@/constants/colors";

export function BackButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace("/")))}
      className="m-4 h-11 w-11 items-center justify-center rounded-full bg-panel active:bg-line"
    >
      <ChevronLeft size={22} color={colors.ink} />
    </Pressable>
  );
}
