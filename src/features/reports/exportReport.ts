import { printText } from "@/lib/printer/printer";
import { buildReportReceipt } from "@/lib/printer/reportReceipt";
import type { ReceiptStore } from "@/lib/printer/receipt";
import type { MenuSalesGroup, Report } from "@/lib/report";
import type { Expense } from "@/types/database";
import { buildReportHtml, reportFileName, type ReportMeta } from "./reportExport";

type PdfModules = {
  Print: typeof import("expo-print");
  Sharing: typeof import("expo-sharing");
  FileSystem: typeof import("expo-file-system");
};

/**
 * Modul PDF dimuat saat dipakai saja (bukan saat halaman Laporan dibuka).
 * APK lama (versi 1.0.0) belum punya modul native ini: tanpa cara ini halaman Laporan
 * langsung crash. Sekarang hanya tombol PDF yang menampilkan pesan minta update APK.
 */
function loadPdfModules(): PdfModules {
  try {
    return {
      Print: require("expo-print"),
      Sharing: require("expo-sharing"),
      FileSystem: require("expo-file-system"),
    };
  } catch {
    throw new Error("Fitur PDF butuh aplikasi versi terbaru (1.1.0). Install APK terbaru dulu.");
  }
}

/** Ukuran A4 dalam titik (72 per inci). */
const A4 = { width: 595, height: 842 };

/**
 * Buat PDF laporan, beri nama rapi (Laporan_NamaToko_Periode.pdf),
 * lalu buka menu bagikan Android (simpan ke Files, kirim WhatsApp, Drive, dll).
 */
export async function shareReportPdf(report: Report, meta: ReportMeta, expenses: Expense[], menuSales: MenuSalesGroup[]): Promise<void> {
  const { Print, Sharing, FileSystem } = loadPdfModules();
  const { File, Paths } = FileSystem;
  const { uri } = await Print.printToFileAsync({ html: buildReportHtml(report, meta, expenses, menuSales), ...A4 });

  // printToFileAsync memberi nama acak -> pindahkan ke nama yang rapi
  const target = new File(Paths.cache, reportFileName(meta));
  if (target.exists) target.delete();
  new File(uri).moveSync(target);

  if (!(await Sharing.isAvailableAsync())) throw new Error("Fitur bagikan file tidak tersedia di perangkat ini.");
  await Sharing.shareAsync(target.uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: "Simpan / bagikan laporan",
  });
}

/** Cetak laporan ringkas ke printer thermal yang dipilih di Setting > Printer. */
export async function printReportReceipt(report: Report, meta: ReportMeta, store: ReceiptStore, menuSales: MenuSalesGroup[]): Promise<void> {
  await printText(buildReportReceipt(report, meta, store, menuSales));
}
