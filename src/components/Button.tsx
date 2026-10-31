import { Pressable, type PressableProps } from "react-native";
import { AppText } from "./AppText";

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

/** Tombol pill besar sesuai desain TemanPOS. */
export function Button({
  title,
  variant = "brand",
  className = "",
  ...props
}: PressableProps & { title: string; variant?: Variant; className?: string }) {
  return (
    <Pressable
      className={`h-14 items-center justify-center rounded-full px-6 active:opacity-80 ${containerClass[variant]} ${className}`}
      {...props}
    >
      <AppText variant="heading" className={`text-base ${textClass[variant]}`}>
        {title}
      </AppText>
    </Pressable>
  );
}
