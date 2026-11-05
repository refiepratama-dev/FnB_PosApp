import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { errorMessage } from "@/lib/errors";
import { amountError, digitsOnly, groupThousands, parseAmount, pettyCashBalanceError } from "./amount";
import { useAddPettyCash, useSetPettyCashBalance } from "./useExpenses";

export function PettyCashModal({
  visible,
  balance,
  action,
  onClose,
}: {
  visible: boolean;
  balance: number;
  action: "set" | "add";
  onClose: () => void;
}) {
  const save = useSetPettyCashBalance();
  const add = useAddPettyCash();
  const [amountText, setAmountText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setAmountText(action === "set" ? String(balance) : "");
    setError("");
  }, [visible, balance, action]);

  function submit() {
    const amount = parseAmount(amountText);
    const problem = action === "add" ? amountError(amountText) : pettyCashBalanceError(amountText);
    if (problem || amount === null) return setError(problem ?? "Nominal kas kecil tidak valid");
    setError("");
    const mutation = action === "add" ? add : save;
    mutation.mutate(amount, {
      onSuccess: onClose,
      onError: (e) =>
        Alert.alert(action === "add" ? "Gagal menambah kas kecil" : "Gagal mengatur kas kecil", errorMessage(e)),
    });
  }

  return (
    <AppModal
      visible={visible}
      title={action === "add" ? "Tambah Kas Kecil" : "Atur Saldo Kas Kecil"}
      onClose={onClose}
      footer={
        <View>
          {error ? <AppText className="mb-3 text-center text-sm text-action">{error}</AppText> : null}
          <Button title={action === "add" ? "Tambah Kas" : "Simpan Saldo"} loading={save.isPending || add.isPending} onPress={submit} />
        </View>
      }
    >
      <TextField
        label={action === "add" ? "Nominal kas yang ditambahkan (Rp)" : "Saldo kas kecil yang tersedia sekarang (Rp)"}
        value={groupThousands(amountText)}
        onChangeText={(text) => setAmountText(digitsOnly(text))}
        keyboardType="number-pad"
        placeholder="0"
      />
      <AppText variant="muted" className="mt-3 text-xs">
        {action === "add"
          ? "Kas tambahan akan mengembalikan pengeluaran yang sebelumnya memakai pemasukan terlebih dahulu. Jika masih ada sisa, sisa tersebut menjadi saldo kas kecil."
          : "Pengeluaran memakai saldo kas kecil terlebih dahulu. Jika saldonya habis, pengeluaran berikutnya dihitung dari pemasukan. Sisa kas kecil terbawa otomatis ke hari berikutnya."}
      </AppText>
      {action === "set" ? (
        <AppText variant="muted" className="mt-2 text-xs">
          Mengatur saldo akan memulai perhitungan baru per hari ini.
        </AppText>
      ) : null}
    </AppModal>
  );
}
