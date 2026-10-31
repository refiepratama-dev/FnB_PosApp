import { ActivityIndicator, Pressable, View } from "react-native";
import { Trash2 } from "lucide-react-native";
import { AppModal } from "@/components/AppModal";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { colors } from "@/constants/colors";
import { errorMessage } from "@/lib/errors";
import { formatDate, formatRupiah } from "@/lib/format";
import type { Member } from "@/types/database";
import { Avatar } from "./Avatar";
import { useMemberSummary } from "./useMembers";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex-1 p-3">
      <AppText variant="muted" className="text-xs">
        {label}
      </AppText>
      <AppText variant="heading" className="mt-1 text-lg" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
    </Card>
  );
}

/** Detail member: ringkasan belanja (bukan daftar order), ubah, dan hapus. */
export function MemberDetailModal({
  member,
  onClose,
  onEdit,
  onDelete,
}: {
  member: Member | null;
  onClose: () => void;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}) {
  const summary = useMemberSummary(member?.id ?? null);

  return (
    <AppModal
      visible={member !== null}
      title="Detail Member"
      onClose={onClose}
      footer={member ? <Button title="Ubah Data" variant="outline" onPress={() => onEdit(member)} /> : undefined}
    >
      {member ? (
        <>
          <View className="mb-5 flex-row items-center gap-4">
            <Avatar name={member.name} size={64} />
            <View className="flex-1">
              <AppText variant="heading" className="text-xl" numberOfLines={2}>
                {member.name}
              </AppText>
              <AppText>{member.phone}</AppText>
              <AppText variant="muted" className="text-xs">
                Terdaftar {formatDate(member.created_at)}
              </AppText>
            </View>
          </View>

          <AppText variant="heading" className="mb-2">
            Ringkasan belanja
          </AppText>
          {summary.isLoading ? (
            <ActivityIndicator color={colors.brand} className="my-6" />
          ) : summary.error ? (
            <AppText variant="muted" className="py-4 text-sm">
              Ringkasan gagal dimuat: {errorMessage(summary.error)}
            </AppText>
          ) : (
            <View className="gap-3">
              <View className="flex-row gap-3">
                <Stat label="Total belanja" value={formatRupiah(summary.data?.totalSpent ?? 0)} />
                <Stat label="Jumlah transaksi" value={String(summary.data?.orderCount ?? 0)} />
              </View>
              <Stat
                label="Terakhir belanja"
                value={summary.data?.lastOrderAt ? formatDate(summary.data.lastOrderAt) : "Belum pernah belanja"}
              />
              <AppText variant="muted" className="text-xs">
                Hanya order yang Lunas. Order dibatalkan tidak dihitung.
              </AppText>
            </View>
          )}

          <Pressable onPress={() => onDelete(member)} className="mt-6 h-11 flex-row items-center justify-center gap-2">
            <Trash2 size={18} color={colors.action} />
            <AppText className="text-action">Hapus member</AppText>
          </Pressable>
        </>
      ) : null}
    </AppModal>
  );
}
