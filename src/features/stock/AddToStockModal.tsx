import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { SearchInput } from "@/components/SearchInput";
import { TextField } from "@/components/TextField";
import { colors } from "@/constants/colors";
import { MenuThumb } from "@/features/products/MenuThumb";
import { errorMessage } from "@/lib/errors";
import { formatRupiah } from "@/lib/format";
import type { MenuItem } from "@/types/database";
import { parseQty, qtyError } from "./stockQty";
import { useAdjustStock } from "./useStock";

/**
 * "+ Tambah menu ke stok": pilih menu satuan (kue, minuman botol, dll) lalu isi jumlah awal.
 * Menu racikan (kopi, nasi goreng) tidak perlu dimasukkan: selalu tersedia.
 */
export function AddToStockModal({
  visible,
  candidates,
  onClose,
}: {
  visible: boolean;
  candidates: MenuItem[]; // menu aktif yang belum dihitung stoknya
  onClose: () => void;
}) {
  const adjust = useAdjustStock();
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<MenuItem | null>(null);
  const [qtyText, setQtyText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setSearch("");
    setPicked(null);
    setQtyText("");
    setError("");
  }, [visible]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates.filter((m) => !q || m.name.toLowerCase().includes(q));
  }, [candidates, search]);

  function submit() {
    if (!picked) return;
    const qty = parseQty(qtyText);
    const problem = qtyError(qty, "adjust");
    if (problem) return setError(problem);
    setError("");

    adjust.mutate(
      { menuItemId: picked.id, mode: "adjust", qty: qty as number, note: "Stok awal" },
      {
        onSuccess: onClose,
        onError: (e) => Alert.alert("Gagal menambahkan ke stok", errorMessage(e)),
      },
    );
  }

  return (
    <AppModal
      visible={visible}
      title={picked ? "Jumlah Stok Awal" : "Tambah Menu ke Stok"}
      onClose={onClose}
      footer={
        picked ? (
          <View>
            {error ? <AppText className="mb-3 text-center text-sm text-action">{error}</AppText> : null}
            <Button title="Tambahkan ke Stok" loading={adjust.isPending} onPress={submit} />
          </View>
        ) : undefined
      }
    >
      {picked ? (
        <View>
          <View className="mb-5 flex-row items-center gap-3 rounded-2xl bg-panel p-3">
            <MenuThumb name={picked.name} imageUrl={picked.image_url} size={56} />
            <View className="flex-1">
              <AppText variant="heading" numberOfLines={1}>
                {picked.name}
              </AppText>
              <AppText variant="muted" className="text-sm">
                {formatRupiah(picked.price)}
              </AppText>
            </View>
            <Pressable onPress={() => setPicked(null)} hitSlop={8}>
              <AppText className="text-sm text-brand">Ganti</AppText>
            </Pressable>
          </View>
          <TextField
            label="Jumlah stok sekarang"
            value={qtyText}
            onChangeText={(t) => setQtyText(t.replace(/\D/g, ""))}
            keyboardType="number-pad"
            placeholder="0"
            autoFocus
          />
        </View>
      ) : candidates.length === 0 ? (
        <AppText variant="muted" className="py-6 text-center">
          Semua menu sudah masuk halaman Stok.
        </AppText>
      ) : (
        <View>
          <SearchInput value={search} onChangeText={setSearch} placeholder="Cari menu..." className="mb-3" />
          {filtered.length === 0 ? (
            <AppText variant="muted" className="py-6 text-center">
              Menu tidak ditemukan.
            </AppText>
          ) : (
            filtered.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => setPicked(m)}
                className="flex-row items-center gap-3 border-b border-line py-3 active:bg-panel"
              >
                <MenuThumb name={m.name} imageUrl={m.image_url} size={48} />
                <View className="flex-1">
                  <AppText variant="heading" numberOfLines={1}>
                    {m.name}
                  </AppText>
                  <AppText variant="muted" className="text-sm">
                    {formatRupiah(m.price)}
                  </AppText>
                </View>
                <ChevronRight size={18} color={colors.inkMuted} />
              </Pressable>
            ))
          )}
        </View>
      )}
    </AppModal>
  );
}
