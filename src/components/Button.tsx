import { ActivityIndicator, Pressable, type PressableProps } from "react-native";
import { AppText } from "./AppText";
import { colors } from "@/constants/colors";
import type { LucideIcon } from "lucide-react-native";

type Variant = "pay" | "action" | "brand" | "outline";

const containerClass: Record<Variant, string> = {
  pay: "bg-success", // hijau: Bayar, Lunas, Simpan order
  action: "bg-action", // merah: Batalkan, hapus
  brand: "bg-brand", // biru: aksi utama non-transaksi
  outline: "bg-white border border-brand",
};

const textClass: Record<Variant, string> = {
  pay: "text-white",
  action: "text-white",
  brand: "text-white",
  outline: "text-brand",
};

/** Tombol pill besar sesuai desain TemanPOS. `loading` = tampilkan spinner & nonaktifkan tombol. */
export function Button({
  title,
  variant = "brand",
  loading = false,
  icon: Icon,
  disabled,
  className = "",
  ...props
}: PressableProps & { title: string; variant?: Variant; loading?: boolean; icon?: LucideIcon; className?: string }) {
  const contentColor = variant === "outline" ? colors.brand : colors.white;
  const isDisabled = disabled || loading;
  return (
    <Pressable
      disabled={isDisabled}
      className={`h-14 flex-row items-center justify-center gap-2 rounded-full px-6 active:opacity-80 ${containerClass[variant]} ${
        isDisabled ? "opacity-50" : ""
      } ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <>
          {Icon ? <Icon size={20} color={contentColor} /> : null}
          <AppText variant="heading" className={`text-base ${textClass[variant]}`}>
            {title}
          </AppText>
        </>
      )}
    </Pressable>
  );
}
