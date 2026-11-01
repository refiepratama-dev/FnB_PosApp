import { useEffect, useState } from "react";
import { Alert, Image, Pressable, View } from "react-native";
import { ImagePlus, Trash2 } from "lucide-react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { TextField } from "@/components/TextField";
import { colors } from "@/constants/colors";
import { errorMessage } from "@/lib/errors";
import { formatDate, formatTime } from "@/lib/format";
import { pickImage } from "@/lib/images";
import type { Expense } from "@/types/database";
import { amountError, digitsOnly, groupThousands, parseAmount } from "./amount";
import { useDeleteExpense, useSaveExpense } from "./useExpenses";

/**
 * Form tambah (expense = null) atau ubah pengeluaran:
 * keterangan, nominal, metode (Tunai/Transfer), foto nota (opsional, dari galeri).
 * Tanggal otomatis (hari ini) dan tidak diubah saat edit. Ada tombol Hapus saat edit.
 */
export function ExpenseFormModal({
  visible,
  expense,
  onClose,
}: {
  visible: boolean;
  expense: Expense | null;
  onClose: () => void;
}) {
  const save = useSaveExpense();
  const remove = useDeleteExpense();

  const [description, setDescription] = useState("");
  const [amountText, setAmountText] = useState(""); // hanya angka
  const [method, setMethod] = useState<"cash" | "transfer">("cash");
  const [receiptUri, setReceiptUri] = useState<string | null>(null); // alamat https (lama) atau file lokal (baru)
  const [error, setError] = useState("");

  // Isi form setiap kali popup dibuka
  useEffect(() => {
    if (!visible) return;
    setDescription(expense?.description ?? "");
    setAmountText(expense ? String(expense.amount) : "");
    setMethod(expense?.method ?? "cash");
    setReceiptUri(expense?.receipt_image_url ?? null);
    setError("");
  }, [visible, expense]);

  const amount = parseAmount(amountText);

  async function choosePhoto() {
    try {
      const uri = await pickImage({ square: false });
      if (uri) setReceiptUri(uri);
    } catch (e) {
      Alert.alert("Foto gagal dipilih", errorMessage(e));
    }
  }

  function submit() {
    if (!description.trim()) return setError("Keterangan wajib diisi");
    const problem = amountError(amountText);
    if (problem || amount === null) return setError(problem ?? "Nominal tidak valid");
    setError("");

    save.mutate(
      {
        id: expense?.id,
        description: description.trim(),
        amount,
        method,
        receiptUri,
        previousUrl: expense?.receipt_image_url ?? null,
      },
      {
        onSuccess: onClose,
        onError: (e) => Alert.alert("Gagal menyimpan", errorMessage(e)),
      },
    );
  }

  function confirmDelete() {
    if (!expense) return;
    Alert.alert("Hapus pengeluaran?", `"${expense.description}" dihapus permanen dan tidak dihitung lagi di laporan.`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () =>
          remove.mutate(expense, {
            onSuccess: onClose,
            onError: (e) => Alert.alert("Gagal menghapus", errorMessage(e)),
          }),
      },
    ]);
  }

  return (
    <AppModal
      visible={visible}
      title={expense ? "Ubah Pengeluaran" : "Tambah Pengeluaran"}
      onClose={onClose}
      footer={
        <View>
          {error ? <AppText className="mb-3 text-center text-sm text-action">{error}</AppText> : null}
          <Button title="Simpan" variant="action" loading={save.isPending} disabled={remove.isPending} onPress={submit} />
        </View>
      }
    >
      <TextField
        label="Keterangan"
        value={description}
        onChangeText={setDescription}
        placeholder="Contoh: Beli es batu"
        maxLength={120}
        className="mb-4"
      />

      <View className="mb-4">
        <TextField
          label="Nominal (Rp)"
          value={groupThousands(amountText)}
          onChangeText={(t) => setAmountText(digitsOnly(t))}
          keyboardType="number-pad"
          placeholder="0"
        />
      </View>

      <AppText className="mb-2 text-sm">Metode</AppText>
      <View className="mb-5 flex-row gap-2">
        <Chip label="Tunai" active={method === "cash"} onPress={() => setMethod("cash")} />
        <Chip label="Transfer" active={method === "transfer"} onPress={() => setMethod("transfer")} />
      </View>

      <AppText className="mb-2 text-sm">Foto nota (opsional)</AppText>
      {receiptUri ? (
        <View className="mb-1">
          <Image
            source={{ uri: receiptUri }}
            resizeMode="contain"
            style={{ width: "100%", height: 220, borderRadius: 16, backgroundColor: colors.panel }}
          />
          <View className="mt-3 flex-row gap-3">
            <Pressable
              onPress={choosePhoto}
              className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-full border border-brand active:bg-brand-soft"
            >
              <ImagePlus size={18} color={colors.brand} />
              <AppText variant="heading" className="text-sm text-brand">
                Ganti Foto
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => setReceiptUri(null)}
              className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-full active:bg-action-soft"
            >
              <Trash2 size={16} color={colors.action} />
              <AppText className="text-sm text-action">Hapus foto</AppText>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={choosePhoto}
          className="h-14 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-panel active:bg-brand-soft"
        >
          <ImagePlus size={20} color={colors.brand} />
          <AppText variant="heading" className="text-sm text-brand">
            Pilih Foto Nota
          </AppText>
        </Pressable>
      )}
      <AppText variant="muted" className="mt-2 text-xs">
        Diambil dari galeri, otomatis dikecilkan supaya hemat kuota.
      </AppText>

      {expense ? (
        <>
          <AppText variant="muted" className="mt-5 text-center text-xs">
            Dicatat {formatDate(expense.created_at)}, {formatTime(expense.created_at)}
          </AppText>
          <Pressable
            onPress={confirmDelete}
            disabled={remove.isPending || save.isPending}
            className="mt-3 h-11 flex-row items-center justify-center gap-2"
          >
            <Trash2 size={18} color={colors.action} />
            <AppText className="text-action">{remove.isPending ? "Menghapus..." : "Hapus pengeluaran ini"}</AppText>
          </Pressable>
        </>
      ) : null}
    </AppModal>
  );
}
