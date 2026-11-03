import { Alert, Image, ScrollView, View } from "react-native";
import { Pencil, Trash2 } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { colors } from "@/constants/colors";
import { errorMessage } from "@/lib/errors";
import { formatDate, formatDateTime, formatRupiah } from "@/lib/format";
import type { Expense } from "@/types/database";
import { useDeleteExpense } from "./useExpenses";

const METHOD_LABEL: Record<Expense["method"], string> = { cash: "Tunai", transfer: "Transfer" };

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 py-1">
      <AppText variant="muted" className="text-sm">
        {label}
      </AppText>
      <AppText className="flex-1 text-right text-sm">{value}</AppText>
    </View>
  );
}

/**
 * Isi detail pengeluaran (polanya sama dengan detail Order):
 * nominal, info, foto nota, lalu tombol Ubah & Hapus di bawah (posisi sama seperti Cetak Ulang & Batalkan).
 */
export function ExpenseDetail({ expense, onEdit, onDeleted }: { expense: Expense; onEdit: () => void; onDeleted: () => void }) {
  const remove = useDeleteExpense();

  function confirmDelete() {
    Alert.alert("Hapus pengeluaran?", `"${expense.description}" dihapus permanen dan tidak dihitung lagi di laporan.`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () =>
          remove.mutate(expense, {
            onSuccess: onDeleted,
            onError: (e) => Alert.alert("Gagal menghapus", errorMessage(e)),
          }),
      },
    ]);
  }

  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="p-5">
        <View className="mb-4 flex-row items-center justify-between gap-3">
          <AppText variant="heading" numberOfLines={1} adjustsFontSizeToFit className="flex-1 text-2xl text-action">
            {formatRupiah(expense.amount)}
          </AppText>
          <View className="rounded-full bg-action-soft px-3 py-1">
            <AppText className="font-heading text-xs text-action">{METHOD_LABEL[expense.method].toUpperCase()}</AppText>
          </View>
        </View>

        <View className="mb-4 rounded-2xl bg-panel px-4 py-3">
          <InfoRow label="Keterangan" value={expense.description} />
          <InfoRow label="Tanggal" value={formatDate(expense.expense_date + "T00:00:00")} />
          <InfoRow label="Dicatat" value={formatDateTime(expense.created_at)} />
          <InfoRow label="Metode" value={METHOD_LABEL[expense.method]} />
        </View>

        <AppText variant="heading" className="mb-2 text-base">
          Foto Nota
        </AppText>
        {expense.receipt_image_url ? (
          <Image
            source={{ uri: expense.receipt_image_url }}
            resizeMode="contain"
            style={{ width: "100%", height: 320, borderRadius: 16, backgroundColor: colors.panel }}
          />
        ) : (
          <View className="items-center rounded-2xl border border-dashed border-line bg-panel py-6">
            <AppText variant="muted" className="text-sm">
              Tidak ada foto nota
            </AppText>
          </View>
        )}
      </ScrollView>

      <View className="flex-row gap-3 border-t border-line p-4">
        <View className="flex-1">
          <Button title="Ubah" variant="outline" icon={Pencil} disabled={remove.isPending} onPress={onEdit} />
        </View>
        <View className="flex-1">
          <Button title="Hapus" variant="action" icon={Trash2} loading={remove.isPending} onPress={confirmDelete} />
        </View>
      </View>
    </View>
  );
}
