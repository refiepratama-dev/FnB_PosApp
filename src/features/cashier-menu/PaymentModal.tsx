import { useState } from "react";
import { Pressable, View } from "react-native";
import { Banknote, CreditCard, Landmark, QrCode, Bike, Wallet, type LucideIcon } from "lucide-react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { colors } from "@/constants/colors";
import { OJOL_PROVIDER_LABEL } from "@/constants/labels";
import { formatRupiah } from "@/lib/format";
import type { OjolCashSource, OjolProvider, PaymentMethod } from "@/types/database";

const METHODS: { value: Exclude<PaymentMethod, "ojol">; label: string; icon: LucideIcon }[] = [
  { value: "cash", label: "Tunai", icon: Banknote },
  { value: "qris", label: "QRIS", icon: QrCode },
  { value: "transfer", label: "Transfer", icon: Landmark },
  { value: "debit", label: "Debit/Kartu", icon: CreditCard },
];

const OJOL_SOURCES: { value: OjolCashSource; label: string; icon: LucideIcon }[] = [
  { value: "driver_cash", label: "Tunai dari driver", icon: Bike },
  { value: "merchant_balance", label: "Saldo merchant", icon: Wallet },
];

function OptionTile({ label, icon: Icon, active, onPress }: { label: string; icon: LucideIcon; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-24 min-w-[45%] flex-1 items-center justify-center gap-2 rounded-3xl border-2 ${
        active ? "border-brand bg-brand-soft" : "border-line bg-white active:bg-panel"
      }`}
    >
      <Icon size={26} color={active ? colors.brand : colors.ink} />
      <AppText className={`text-sm ${active ? "font-heading text-brand" : ""}`}>{label}</AppText>
    </Pressable>
  );
}

/** Pilih metode bayar lalu tekan Lunas. Semua dicatat manual (tanpa hitung kembalian). */
export function PaymentModal({
  total,
  isOjol,
  provider,
  saving,
  onClose,
  onPay,
}: {
  total: number;
  isOjol: boolean;
  provider: OjolProvider;
  saving: boolean;
  onClose: () => void;
  onPay: (method: PaymentMethod, ojolSource?: OjolCashSource) => void;
}) {
  const [method, setMethod] = useState<Exclude<PaymentMethod, "ojol">>("cash");
  const [source, setSource] = useState<OjolCashSource>("merchant_balance");

  return (
    <AppModal
      visible
      title={isOjol ? `Simpan Order ${OJOL_PROVIDER_LABEL[provider]}` : "Pembayaran"}
      onClose={saving ? () => {} : onClose}
      footer={
        <Button
          title={isOjol ? "Simpan" : "Lunas"}
          variant="action"
          loading={saving}
          onPress={() => (isOjol ? onPay("ojol", source) : onPay(method))}
        />
      }
    >
      <View className="mb-5 items-center rounded-3xl bg-panel py-5">
        <AppText variant="muted" className="text-sm">
          Total
        </AppText>
        <AppText variant="heading" className="text-4xl">
          {formatRupiah(total)}
        </AppText>
      </View>

      <AppText variant="heading" className="mb-3 text-base">
        {isOjol ? "Uang masuk lewat" : "Metode pembayaran"}
      </AppText>
      <View className="flex-row flex-wrap gap-3">
        {isOjol
          ? OJOL_SOURCES.map((s) => (
              <OptionTile key={s.value} label={s.label} icon={s.icon} active={source === s.value} onPress={() => setSource(s.value)} />
            ))
          : METHODS.map((m) => (
              <OptionTile key={m.value} label={m.label} icon={m.icon} active={method === m.value} onPress={() => setMethod(m.value)} />
            ))}
      </View>
    </AppModal>
  );
}
