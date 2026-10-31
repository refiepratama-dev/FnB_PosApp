import { Pressable, type PressableProps } from "react-native";
import { AppText } from "./AppText";

/** Tombol pilihan kecil (kategori, filter). Aktif = biru. */
export function Chip({
  label,
  active = false,
  className = "",
  ...props
}: PressableProps & { label: string; active?: boolean; className?: string }) {
  return (
    <Pressable
      className={`h-10 items-center justify-center rounded-full border px-4 ${
        active ? "border-brand bg-brand" : "border-line bg-white active:bg-panel"
      } ${className}`}
      {...props}
    >
      <AppText className={`text-sm ${active ? "font-heading text-white" : "text-ink"}`}>{label}</AppText>
    </Pressable>
  );
}
