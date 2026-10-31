import { View, type ViewProps } from "react-native";

/** Kotak putih rounded dengan garis tipis. */
export function Card({ className = "", ...props }: ViewProps & { className?: string }) {
  return <View className={`rounded-3xl border border-line bg-white p-4 ${className}`} {...props} />;
}
