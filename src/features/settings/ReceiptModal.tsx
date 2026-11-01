import { useEffect, useState } from "react";
import { Alert, TextInput, View } from "react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { colors } from "@/constants/colors";
import { useUpdateStoreSettings } from "@/hooks/useStoreSettings";
import { errorMessage } from "@/lib/errors";
import type { StoreSettings } from "@/types/database";

const FOOTER_MAX = 150;

/** Footer struk (teks di bagian bawah struk) dan ukuran kertas printer (58 / 80 mm). */
export function ReceiptModal({
  visible,
  settings,
  onClose,
}: {
  visible: boolean;
  settings: StoreSettings;
  onClose: () => void;
}) {
  const update = useUpdateStoreSettings();
  const [footer, setFooter] = useState("");
  const [paper, setPaper] = useState<"58" | "80">("58");

  useEffect(() => {
    if (!visible) return;
    setFooter(settings.receipt_footer ?? "");
    setPaper(settings.paper_size === "80" ? "80" : "58");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function submit() {
    update.mutate(
      { receipt_footer: footer.trim(), paper_size: paper },
      {
        onSuccess: onClose,
        onError: (e) => Alert.alert("Gagal menyimpan", errorMessage(e)),
      },
    );
  }

  return (
    <AppModal
      visible={visible}
      title="Struk & Kertas"
      onClose={onClose}
      footer={<Button title="Simpan" loading={update.isPending} onPress={submit} />}
    >
      <AppText className="mb-2 text-sm">Footer struk</AppText>
      <TextInput
        value={footer}
        onChangeText={setFooter}
        placeholder="Contoh: Terima kasih, sampai jumpa lagi!"
        placeholderTextColor={colors.inkMuted}
        multiline
        maxLength={FOOTER_MAX}
        textAlignVertical="top"
        className="min-h-24 rounded-2xl border border-line bg-panel p-4 font-sans text-base text-ink focus:border-brand"
      />
      <AppText variant="muted" className="mb-5 mt-1 text-right text-xs">
        {footer.length}/{FOOTER_MAX}
      </AppText>

      <AppText className="mb-2 text-sm">Ukuran kertas printer</AppText>
      <View className="mb-2 flex-row gap-2">
        <Chip label="58 mm" active={paper === "58"} onPress={() => setPaper("58")} />
        <Chip label="80 mm" active={paper === "80"} onPress={() => setPaper("80")} />
      </View>
      <AppText variant="muted" className="text-xs">
        58 mm = 32 huruf per baris, 80 mm = 48 huruf. Pilih printer di menu Setting, Printer.
      </AppText>
    </AppModal>
  );
}
