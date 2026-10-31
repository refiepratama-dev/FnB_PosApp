import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { SearchInput } from "@/components/SearchInput";
import { TextField } from "@/components/TextField";
import { colors } from "@/constants/colors";
import { errorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/queryClient";
import { getSupabase } from "@/lib/supabase";
import type { Member } from "@/types/database";

/** Pilih member untuk order, atau tambah member baru (nama + no HP). */
export function MemberPickerModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (member: { id: string; name: string }) => void;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const members = useQuery({
    queryKey: [...queryKeys.members, "picker", search],
    queryFn: async () => {
      let q = getSupabase().from("members").select("*").order("name").limit(30);
      const s = search.trim().replace(/[%,()]/g, "");
      if (s) q = q.or(`name.ilike.%${s}%,phone.ilike.%${s}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Member[];
    },
  });

  const addMember = useMutation({
    mutationFn: async () => {
      const { data, error } = await getSupabase()
        .from("members")
        .insert({ name: name.trim(), phone: phone.replace(/\D/g, "") })
        .select()
        .single();
      if (error) throw error;
      return data as Member;
    },
    onSuccess: (member) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members });
      onSelect({ id: member.id, name: member.name });
    },
    onError: (e) => Alert.alert("Gagal menyimpan member", errorMessage(e)),
  });

  if (adding) {
    return (
      <AppModal
        visible
        title="Member Baru"
        onClose={onClose}
        footer={
          <View className="flex-row gap-3">
            <Button title="Kembali" variant="outline" className="flex-1" onPress={() => setAdding(false)} />
            <Button
              title="Simpan & Pilih"
              className="flex-1"
              loading={addMember.isPending}
              disabled={!name.trim() || phone.replace(/\D/g, "").length < 10}
              onPress={() => addMember.mutate()}
            />
          </View>
        }
      >
        <TextField label="Nama" value={name} onChangeText={setName} placeholder="Nama pelanggan" className="mb-4" />
        <TextField label="No. HP" value={phone} onChangeText={setPhone} placeholder="08xxxxxxxxxx" keyboardType="phone-pad" />
      </AppModal>
    );
  }

  return (
    <AppModal
      visible
      title="Pilih Member"
      onClose={onClose}
      footer={<Button title="+ Member Baru" variant="outline" onPress={() => setAdding(true)} />}
    >
      <SearchInput value={search} onChangeText={setSearch} placeholder="Cari nama / no HP" className="mb-3" />
      {members.isLoading ? (
        <ActivityIndicator color={colors.brand} className="my-6" />
      ) : members.data?.length ? (
        members.data.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => onSelect({ id: m.id, name: m.name })}
            className="border-b border-line py-3 active:bg-panel"
          >
            <AppText variant="heading">{m.name}</AppText>
            <AppText variant="muted" className="text-sm">
              {m.phone}
            </AppText>
          </Pressable>
        ))
      ) : (
        <View className="items-center gap-2 py-6">
          <UserPlus size={24} color={colors.inkMuted} />
          <AppText variant="muted">Member tidak ditemukan</AppText>
        </View>
      )}
    </AppModal>
  );
}
