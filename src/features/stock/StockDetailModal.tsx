import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { LogOut } from "lucide-react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { TextField } from "@/components/TextField";
import { colors } from "@/constants/colors";
import { MenuThumb } from "@/components/MenuThumb";
import { errorMessage } from "@/lib/errors";
import type { MenuItem } from "@/types/database";
import { MovementRow } from "./MovementRow";
import { parseQty, qtyError, stockAfter } from "./stockQty";
import { useAdjustStock, useStockMovements, useUntrackStock } from "./useStock";

/** Detail satu menu di halaman Stok: tambah stok, sesuaikan, riwayat, keluarkan dari Stok. */
export function StockDetailModal({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  const adjust = useAdjustStock();
  const untrack = useUntrackStock();
  const history = useStockMovements(item?.id ?? null, 10, item !== null);

  const [mode, setMode] = useState<"add" | "adjust">("add");
  const [qtyText, setQtyText] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  // Form bersih setiap kali membuka menu lain
  const itemId = item?.id;
  useEffect(() => {
    setMode("add");
    setQtyText("");
    setNote("");
    setError("");
  }, [itemId]);

  const qty = parseQty(qtyText);
  const current = item?.stock_qty ?? 0;

  function submit() {
    if (!item) return;
    const problem = qtyError(qty, mode);
    if (problem) return setError(problem);
    setError("");

    adjust.mutate(
      { menuItemId: item.id, mode, qty: qty as number, note },
      {
        onSuccess: onClose,
        onError: (e) => Alert.alert("Gagal menyimpan stok", errorMessage(e)),
      },
    );
  }

  function confirmUntrack() {
    if (!item) return;
    Alert.alert(
      "Keluarkan dari halaman Stok?",
      `"${item.name}" tidak lagi dihitung stoknya dan menjadi selalu tersedia. Riwayat stok tetap tersimpan.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Keluarkan",
          style: "destructive",
          onPress: () =>
            untrack.mutate(item.id, {
              onSuccess: onClose,
              onError: (e) => Alert.alert("Gagal mengeluarkan menu", errorMessage(e)),
            }),
        },
      ],
    );
  }

  return (
    <AppModal
      visible={item !== null}
      title={item?.name ?? "Stok"}
      onClose={onClose}
      footer={
        <View>
          {error ? <AppText className="mb-3 text-center text-sm text-action">{error}</AppText> : null}
          <Button title="Simpan" loading={adjust.isPending} onPress={submit} />
        </View>
      }
    >
      {item ? (
        <>
          <View className="mb-5 items-center">
            <MenuThumb name={item.name} imageUrl={item.image_url} size={72} />
            <AppText variant="muted" className="mt-3 text-sm">
              Stok sekarang
            </AppText>
            <AppText variant="heading" className="text-5xl">
              {current}
            </AppText>
            {current === 0 ? (
              <View className="mt-1 rounded-full bg-action-soft px-3 py-1">
                <AppText variant="heading" className="text-xs text-action">
                  HABIS
                </AppText>
              </View>
            ) : null}
          </View>

          <View className="mb-4 flex-row gap-2">
            <Chip
              label="Tambah stok"
              active={mode === "add"}
              onPress={() => {
                setMode("add");
                setError("");
              }}
              className="flex-1"
            />
            <Chip
              label="Sesuaikan"
              active={mode === "adjust"}
              onPress={() => {
                setMode("adjust");
                setError("");
              }}
              className="flex-1"
            />
          </View>

          <View className="mb-4">
            <TextField
              label={mode === "add" ? "Jumlah yang ditambahkan" : "Jumlah stok sebenarnya"}
              value={qtyText}
              onChangeText={(t) => setQtyText(t.replace(/\D/g, ""))}
              keyboardType="number-pad"
              placeholder="0"
            />
            {qty !== null && !qtyError(qty, mode) ? (
              <AppText variant="muted" className="mt-1 text-xs">
                Stok menjadi {stockAfter(current, qty, mode)}
                {mode === "adjust" && qty !== current ? ` (${qty > current ? "+" : ""}${qty - current})` : ""}
              </AppText>
            ) : null}
          </View>

          <TextField
            label="Catatan (opsional)"
            value={note}
            onChangeText={setNote}
            placeholder={mode === "add" ? "Contoh: barang datang" : "Contoh: hitung ulang fisik"}
            className="mb-6"
          />

          <AppText variant="heading" className="mb-1">
            Riwayat terakhir
          </AppText>
          {history.isLoading ? (
            <ActivityIndicator color={colors.brand} className="my-4" />
          ) : history.error ? (
            <AppText variant="muted" className="py-3 text-sm">
              Riwayat gagal dimuat: {errorMessage(history.error)}
            </AppText>
          ) : history.data && history.data.length > 0 ? (
            history.data.map((m) => <MovementRow key={m.id} movement={m} />)
          ) : (
            <AppText variant="muted" className="py-3 text-sm">
              Belum ada riwayat.
            </AppText>
          )}

          <Pressable onPress={confirmUntrack} className="mt-6 h-11 flex-row items-center justify-center gap-2">
            <LogOut size={18} color={colors.action} />
            <AppText className="text-action">Keluarkan dari halaman Stok</AppText>
          </Pressable>
        </>
      ) : null}
    </AppModal>
  );
}
