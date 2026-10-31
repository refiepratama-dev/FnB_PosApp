import { useMemo, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { ChevronRight, Plus, Users } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { EmptyState } from "@/components/EmptyState";
import { QueryState } from "@/components/QueryState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SearchInput } from "@/components/SearchInput";
import { colors } from "@/constants/colors";
import { GridList } from "@/features/products/GridList";
import { HeaderAction } from "@/features/products/HeaderAction";
import { errorMessage } from "@/lib/errors";
import { useSession } from "@/store/session";
import type { Member } from "@/types/database";
import { Avatar } from "./Avatar";
import { MemberDetailModal } from "./MemberDetailModal";
import { MemberFormModal } from "./MemberFormModal";
import { OwnerPinModal } from "./OwnerPinModal";
import { useDeleteMember, useMembers } from "./useMembers";

function MemberCard({ member, onPress }: { member: Member; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-3xl border border-line bg-white p-3 active:bg-panel"
    >
      <Avatar name={member.name} size={48} />
      <View className="flex-1">
        <AppText variant="heading" numberOfLines={1}>
          {member.name}
        </AppText>
        <AppText variant="muted" className="text-sm">
          {member.phone}
        </AppText>
      </View>
      <ChevronRight size={18} color={colors.inkMuted} />
    </Pressable>
  );
}

/**
 * Member (dipakai Kasir landscape & Owner portrait): daftar, cari, tambah/ubah, ringkasan belanja.
 * Hapus member: Owner langsung, Kasir harus memasukkan PIN owner dulu.
 * Penanggung jawab: Ridho (lihat docs/CODING-GUIDE.md)
 */
export default function MembersScreen() {
  const query = useMembers();
  const remove = useDeleteMember();
  const mode = useSession((s) => s.mode);

  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Member | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null); // null = member baru
  const [pinFor, setPinFor] = useState<Member | null>(null);

  const members = query.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q) || (digits.length > 0 && m.phone.includes(digits)));
  }, [members, search]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(member: Member) {
    setDetail(null);
    setEditing(member);
    setFormOpen(true);
  }

  function deleteNow(member: Member) {
    remove.mutate(member.id, {
      onSuccess: () => {
        setPinFor(null);
        setDetail(null);
      },
      onError: (e) => {
        setPinFor(null);
        Alert.alert("Gagal menghapus", errorMessage(e));
      },
    });
  }

  function askDelete(member: Member) {
    Alert.alert(
      "Hapus member?",
      `"${member.name}" dihapus permanen. Order lama tetap tersimpan dengan namanya.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            if (mode === "cashier") {
              setDetail(null);
              setPinFor(member); // 🔒 kasir butuh PIN owner
            } else {
              deleteNow(member);
            }
          },
        },
      ],
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Member" right={<HeaderAction label="Member" icon={Plus} onPress={openNew} />} />

      <View className="gap-2 border-b border-line px-4 py-3">
        <SearchInput value={search} onChangeText={setSearch} placeholder="Cari nama atau nomor HP..." />
        {members.length > 0 ? (
          <AppText variant="muted" className="text-xs">
            {search.trim() ? `${filtered.length} dari ${members.length} member` : `${members.length} member`}
          </AppText>
        ) : null}
      </View>

      {query.isLoading || query.error ? (
        <QueryState query={query} />
      ) : (
        <GridList
          data={filtered}
          keyExtractor={(m) => m.id}
          refreshing={query.isRefetching}
          onRefresh={() => query.refetch()}
          renderItem={(m) => <MemberCard member={m} onPress={() => setDetail(m)} />}
          empty={
            members.length === 0 ? (
              <EmptyState icon={Users} title="Belum ada member" description="Tambahkan member dengan nama dan nomor HP.">
                <HeaderAction label="Tambah Member" icon={Plus} onPress={openNew} />
              </EmptyState>
            ) : (
              <EmptyState icon={Users} title="Member tidak ditemukan" description="Coba nama atau nomor HP lain." />
            )
          }
        />
      )}

      <MemberDetailModal member={detail} onClose={() => setDetail(null)} onEdit={openEdit} onDelete={askDelete} />
      <MemberFormModal visible={formOpen} member={editing} onClose={() => setFormOpen(false)} />
      <OwnerPinModal
        visible={pinFor !== null}
        title="PIN Owner untuk Hapus Member"
        onClose={() => setPinFor(null)}
        onVerified={() => pinFor && deleteNow(pinFor)}
      />
    </View>
  );
}
