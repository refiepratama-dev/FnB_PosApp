import { Text, type TextProps } from "react-native";

type Variant = "body" | "heading" | "muted";

const variantFont: Record<Variant, string> = {
  body: "font-sans",
  heading: "font-heading",
  muted: "font-sans",
};

const variantColor: Record<Variant, string> = {
  body: "text-ink",
  heading: "text-ink",
  muted: "text-ink-muted",
};

// Kalau className sudah berisi warna teks (misal text-brand), warna bawaan variant tidak dipakai
const COLOR_CLASS = /(^|\s)text-(ink|ink-muted|brand|action|success|white|line|panel)(\s|$)/;

/**
 * Pakai <AppText> sebagai pengganti <Text> supaya font DM Sans selalu terpasang.
 * Contoh: <AppText variant="heading" className="text-2xl text-brand">Halo</AppText>
 */
export function AppText({
  variant = "body",
  className = "",
  ...props
}: TextProps & { variant?: Variant; className?: string }) {
  const hasColor = COLOR_CLASS.test(className);
  const hasFont = /(^|\s)font-(sans|regular|heading)(\s|$)/.test(className);
  const classes = [hasFont ? "" : variantFont[variant], hasColor ? "" : variantColor[variant], className].join(" ");
  return <Text className={classes} {...props} />;
}
