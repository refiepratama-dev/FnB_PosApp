import { useCallback, useState } from "react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { getSavedPrinter, isPrinterSupported, printText } from "@/lib/printer/printer";
import { buildReceipt } from "@/lib/printer/receipt";
import { getSupabase } from "@/lib/supabase";
import type { Order, OrderItem } from "@/types/database";

/**
 * Status cetak struk:
 * - idle      : belum mencetak
 * - printing  : sedang mengirim ke printer
 * - done      : struk tercetak
 * - failed    : gagal (pesan di `error`), kasir bisa tekan Cetak Ulang
 * - skipped   : tidak dicetak otomatis karena printer belum diatur / Expo Go
 */
export type PrintStatus = "idle" | "printing" | "done" | "failed" | "skipped";

async function fetchItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await getSupabase().from("order_items").select("*").eq("order_id", orderId);
  if (error) throw error;
  return data as OrderItem[];
}

/**
 * Cetak struk 1 order ke printer yang dipilih di Setting > Printer.
 *
 *   const receipt = usePrintReceipt();
 *   receipt.print(order, items, { auto: true })   // setelah Lunas
 *   receipt.print(order, order.order_items)        // tombol Cetak Ulang
 *
 * Kalau items tidak dikirim, diambil dari database. Mengembalikan pesan error, atau null kalau berhasil.
 * auto: true -> kalau printer belum diatur, diam saja (status "skipped"), tidak dianggap error.
 * Order TIDAK pernah gagal hanya karena printer bermasalah.
 */
export function usePrintReceipt() {
  const settings = useStoreSettings().data;
  const [status, setStatus] = useState<PrintStatus>("idle");
  const [error, setError] = useState("");

  const print = useCallback(
    async (order: Order, items?: OrderItem[], options: { auto?: boolean } = {}): Promise<string | null> => {
      if (options.auto && (!isPrinterSupported() || !(await getSavedPrinter()))) {
        setStatus("skipped");
        setError("");
        return null;
      }
      setStatus("printing");
      setError("");
      try {
        if (!settings) throw new Error("Pengaturan toko belum termuat. Cek koneksi internet.");
        const lines = items ?? (await fetchItems(order.id));
        await printText(buildReceipt(order, lines, settings));
        setStatus("done");
        return null;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setStatus("failed");
        setError(message);
        return message;
      }
    },
    [settings],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError("");
  }, []);

  return { status, error, print, reset };
}
