import { QueryClient } from "@tanstack/react-query";

/**
 * Pengaturan cache data (TanStack Query).
 * Data disimpan sementara di memori supaya pindah halaman terasa cepat,
 * dan otomatis diambil ulang kalau sudah lebih dari 30 detik.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

/**
 * Nama-nama "kunci" data. Pakai kunci yang sama di seluruh app supaya
 * setelah menyimpan data, halaman lain ikut ter-update:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.menu })
 */
export const queryKeys = {
  storeSettings: ["store-settings"] as const,
  menu: ["menu"] as const,
  categories: ["categories"] as const,
  orders: ["orders"] as const,
  members: ["members"] as const,
  expenses: ["expenses"] as const,
  stock: ["stock"] as const,
  report: ["report"] as const,
};
