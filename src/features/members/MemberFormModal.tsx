import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { errorMessage } from "@/lib/errors";
import type { Member } from "@/types/database";
import { normalizePhone, phoneError } from "./phone";
import { useSaveMember } from "./useMembers";

/** Form tambah (member = null) atau ubah member: nama + nomor HP. */
export function MemberFormModal({
  visible,
  member,
  onClose,
}: {
  visible: boolean;
  member: Member | null;
  onClose: () => void;
}) {
  const save = useSaveMember();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setName(member?.name ?? "");
    setPhone(member?.phone ?? "");
    setError("");
  }, [visible, member]);

  function submit() {
    if (!name.trim()) return setError("Nama member wajib diisi");
    const problem = phoneError(phone);
    if (problem) return setError(problem);
    setError("");

    save.mutate(
      { id: member?.id, name: name.trim(), phone: normalizePhone(phone) },
      {
        onSuccess: onClose,
        onError: (e) => Alert.alert("Gagal menyimpan", errorMessage(e)),
      },
    );
  }

  return (
    <AppModal
      visible={visible}
      title={member ? "Ubah Member" : "Tambah Member"}
      onClose={onClose}
      footer={
        <View>
          {error ? <AppText className="mb-3 text-center text-sm text-action">{error}</AppText> : null}
          <Button title="Simpan" loading={save.isPending} onPress={submit} />
        </View>
      }
    >
      <TextField label="Nama" value={name} onChangeText={setName} placeholder="Nama member" autoCapitalize="words" className="mb-4" />
      <TextField
        label="Nomor HP"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="08xxxxxxxxxx"
      />
      <AppText variant="muted" className="mt-2 text-xs">
        Diawali 08 atau 62, 10–14 digit. Satu nomor hanya untuk satu member.
      </AppText>
    </AppModal>
  );
}
