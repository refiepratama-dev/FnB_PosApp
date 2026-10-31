import { Text, type TextProps } from "react-native";

type Variant = "body" | "heading" | "muted";

const variantClass: Record<Variant, string> = {
  body: "font-sans text-ink",
  heading: "font-heading text-ink",
  muted: "font-sans text-ink-muted",
};

/**
 * Pakai <AppText> sebagai pengganti <Text> supaya font DM Sans selalu terpasang.
 * Contoh: <AppText variant="heading" className="text-2xl">Halo</AppText>
 */
export function AppText({
  variant = "body",
  className = "",
  ...props
}: TextProps & { variant?: Variant; className?: string }) {
  return <Text className={`${variantClass[variant]} ${className}`} {...props} />;
}
