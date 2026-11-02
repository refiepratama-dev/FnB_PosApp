import { Pressable, type PressableProps } from "react-native";
import { AppText } from "./AppText";

/** Tombol pilihan kecil (kategori, filter). Aktif = oranye lembut. */
export function Chip({
  label,
  active = false,
  className = "",
  ...props
}: PressableProps & { label: string; active?: boolean; className?: string }) {
  return (
    <Pressable
      className={`h-10 items-center justify-center rounded-full border px-4 ${
        active ? "border-accent bg-accent-soft" : "border-line bg-white active:bg-panel"
      } ${className}`}
      {...props}
    >
      <AppText className={`text-sm ${active ? "font-heading text-accent-ink" : "text-ink"}`}>{label}</AppText>
    </Pressable>
  );
}
