import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { OJOL_PROVIDER_LABEL } from "@/constants/labels";
import { useUpdateStoreSettings } from "@/hooks/useStoreSettings";
import { errorMessage } from "@/lib/errors";
import type { OjolProvider, StoreSettings } from "@/types/database";
import { parsePercent, percentText, sanitizePercentInput } from "./percent";

const PROVIDERS: OjolProvider[] = ["gofood", "grabfood", "shopeefood"];

/**
 * Persen kenaikan harga ojol per provider (GoFood / GrabFood / ShopeeFood).
 * Dipakai otomatis untuk semua menu saat kasir memilih tipe Ojol,
 * hasilnya dibulatkan ke atas ke kelipatan Rp500 (docs/05 bagian A).
 */
export function OjolMarkupModal({
  visible,
  settings,
  onClose,
}: {
  visible: boolean;
  settings: StoreSettings;
  onClose: () => void;
}) {
  const update = useUpdateStoreSettings();
  const [texts, setTexts] = useState<Record<OjolProvider, string>>({ gofood: "", grabfood: "", shopeefood: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setTexts({
      gofood: percentText(Number(settings.ojol_markup?.gofood ?? 0)),
      grabfood: percentText(Number(settings.ojol_markup?.grabfood ?? 0)),
      shopeefood: percentText(Number(settings.ojol_markup?.shopeefood ?? 0)),
    });
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function submit() {
    const markup = {} as Record<OjolProvider, number>;
    for (const provider of PROVIDERS) {
      const value = parsePercent(texts[provider]);
      if (value === null) return setError(`Persen ${OJOL_PROVIDER_LABEL[provider]} harus angka 0 sampai 100`);
      markup[provider] = value;
    }
    setError("");

    update.mutate(
      { ojol_markup: markup },
      {
        onSuccess: onClose,
        onError: (e) => Alert.alert("Gagal menyimpan", errorMessage(e)),
      },
    );
  }

  return (
    <AppModal
      visible={visible}
      title="Harga Ojol"
      onClose={onClose}
      footer={
        <View>
          {error ? <AppText className="mb-3 text-center text-sm text-action">{error}</AppText> : null}
          <Button title="Simpan" loading={update.isPending} onPress={submit} />
        </View>
      }
    >
      {PROVIDERS.map((provider) => (
        <TextField
          key={provider}
          label={`${OJOL_PROVIDER_LABEL[provider]} (naik %)`}
          value={texts[provider]}
          onChangeText={(t) => setTexts((prev) => ({ ...prev, [provider]: sanitizePercentInput(t) }))}
          keyboardType="decimal-pad"
          placeholder="20"
          className="mb-4"
        />
      ))}
      <AppText variant="muted" className="text-xs">
        Contoh: naik 25% pada menu Rp13.500 jadi Rp16.875, dibulatkan ke atas menjadi Rp17.000. Berlaku untuk order
        baru; order lama tidak berubah.
      </AppText>
    </AppModal>
  );
}
