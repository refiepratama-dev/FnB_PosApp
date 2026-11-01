import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useUpdateStoreSettings } from "@/hooks/useStoreSettings";
import { errorMessage } from "@/lib/errors";
import type { StoreSettings } from "@/types/database";
import { parsePercent, percentText, sanitizePercentInput } from "./percent";
import { ToggleRow } from "./ToggleRow";

/**
 * Pajak (PB1) & service charge: on/off + persen. Default mati (docs/03 bagian 10).
 * Urutan hitung: subtotal - diskon -> + service -> + pajak.
 */
export function TaxServiceModal({
  visible,
  settings,
  onClose,
}: {
  visible: boolean;
  settings: StoreSettings;
  onClose: () => void;
}) {
  const update = useUpdateStoreSettings();
  const [taxOn, setTaxOn] = useState(false);
  const [taxText, setTaxText] = useState("");
  const [serviceOn, setServiceOn] = useState(false);
  const [serviceText, setServiceText] = useState("");
  const [error, setError] = useState("");

  // Isi form dari pengaturan saat ini, setiap kali popup dibuka
  useEffect(() => {
    if (!visible) return;
    setTaxOn(settings.tax_enabled);
    setTaxText(percentText(Number(settings.tax_percent)));
    setServiceOn(settings.service_enabled);
    setServiceText(percentText(Number(settings.service_percent)));
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function submit() {
    const tax = parsePercent(taxText);
    const service = parsePercent(serviceText);
    if (tax === null) return setError("Persen pajak harus angka 0 sampai 100");
    if (service === null) return setError("Persen service harus angka 0 sampai 100");
    setError("");

    update.mutate(
      { tax_enabled: taxOn, tax_percent: tax, service_enabled: serviceOn, service_percent: service },
      {
        onSuccess: onClose,
        onError: (e) => Alert.alert("Gagal menyimpan", errorMessage(e)),
      },
    );
  }

  return (
    <AppModal
      visible={visible}
      title="Pajak & Service"
      onClose={onClose}
      footer={
        <View>
          {error ? <AppText className="mb-3 text-center text-sm text-action">{error}</AppText> : null}
          <Button title="Simpan" loading={update.isPending} onPress={submit} />
        </View>
      }
    >
      <ToggleRow title="Pajak (PB1)" subtitle="Ditambahkan ke total order" value={taxOn} onValueChange={setTaxOn} />
      <TextField
        label="Persen pajak (%)"
        value={taxText}
        onChangeText={(t) => setTaxText(sanitizePercentInput(t))}
        keyboardType="decimal-pad"
        editable={taxOn}
        placeholder="10"
        className={`mb-6 mt-3 ${taxOn ? "" : "opacity-40"}`}
      />

      <ToggleRow title="Service charge" subtitle="Ditambahkan ke total order" value={serviceOn} onValueChange={setServiceOn} />
      <TextField
        label="Persen service (%)"
        value={serviceText}
        onChangeText={(t) => setServiceText(sanitizePercentInput(t))}
        keyboardType="decimal-pad"
        editable={serviceOn}
        placeholder="5"
        className={`mb-4 mt-3 ${serviceOn ? "" : "opacity-40"}`}
      />

      <AppText variant="muted" className="text-xs">
        Harga menu belum termasuk pajak. Urutan hitung: subtotal - diskon, lalu + service, lalu + pajak. Pajak & service
        tidak dihitung sebagai omzet di laporan.
      </AppText>
    </AppModal>
  );
}
