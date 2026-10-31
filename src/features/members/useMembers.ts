import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { getSupabase } from "@/lib/supabase";
import type { Member } from "@/types/database";

/** Semua member, urut nama. */
export function useMembers() {
  return useQuery({
    queryKey: queryKeys.members,
    queryFn: async () => {
      const { data, error } = await getSupabase().from("members").select("*").order("name");
      if (error) throw error;
      return data as Member[];
    },
  });
}

export type MemberSummary = { totalSpent: number; orderCount: number; lastOrderAt: string | null };

/**
 * Ringkasan belanja satu member dari order yang Lunas (order dibatalkan tidak dihitung).
 * totalSpent = jumlah total order (yang benar-benar dibayar member).
 */
export function useMemberSummary(memberId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.members, "summary", memberId],
    enabled: memberId !== null,
    queryFn: async (): Promise<MemberSummary> => {
      const supabase = getSupabase();
      const PAGE = 1000; // batas baris per permintaan Supabase
      let totalSpent = 0;
      let orderCount = 0;
      let lastOrderAt: string | null = null;

      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("orders")
          .select("total, created_at")
          .eq("member_id", memberId)
          .eq("status", "paid")
          .order("created_at", { ascending: false })
          .range(from, from + PAGE - 1);
        if (error) throw error;

        const rows = (data ?? []) as { total: number; created_at: string }[];
        if (from === 0 && rows.length > 0) lastOrderAt = rows[0].created_at;
        for (const row of rows) totalSpent += row.total;
        orderCount += rows.length;
        if (rows.length < PAGE) break;
      }
      return { totalSpent, orderCount, lastOrderAt };
    },
  });
}

/** Tambah (tanpa id) atau ubah (dengan id) member. */
export function useSaveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; name: string; phone: string }) => {
      const values = { name: input.name, phone: input.phone };
      const query = input.id
        ? getSupabase().from("members").update(values).eq("id", input.id)
        : getSupabase().from("members").insert(values);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members }),
  });
}

/** Hapus permanen. Order lama tetap ada (nama member sudah tersalin di order). */
export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase().from("members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members }),
  });
}
