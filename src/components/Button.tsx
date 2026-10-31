import { ActivityIndicator, Pressable, type PressableProps } from "react-native";
import { AppText } from "./AppText";
import { colors } from "@/constants/colors";

type Variant = "action" | "brand" | "outline";

const containerClass: Record<Variant, string> = {
  action: "bg-action", // merah: Bayar, Lunas, Simpan
  brand: "bg-brand", // biru: aksi utama non-transaksi
  outline: "bg-white border border-brand",
};

const textClass: Record<Variant, string> = {
  action: "text-white",
  brand: "text-white",
  outline: "text-brand",
};

/** Tombol pill besar sesuai desain TemanPOS. `loading` = tampilkan spinner & nonaktifkan tombol. */
export function Button({
  title,
  variant = "brand",
  loading = false,
  disabled,
  className = "",
  ...props
}: PressableProps & { title: string; variant?: Variant; loading?: boolean; className?: string }) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      disabled={isDisabled}
      className={`h-14 items-center justify-center rounded-full px-6 active:opacity-80 ${containerClass[variant]} ${
        isDisabled ? "opacity-50" : ""
      } ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? colors.brand : colors.white} />
      ) : (
        <AppText variant="heading" className={`text-base ${textClass[variant]}`}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}
