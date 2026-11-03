import { formatDateTime, formatRupiah } from "@/lib/format";
import type { MenuSalesGroup, Report } from "@/lib/report";
import { orderTypeLabel, paymentLabel, type ReportMeta } from "@/features/reports/reportExport";
import { CMD, center, charsPerLine, divider, row } from "./escpos";
import { header, joinLines, type ReceiptStore } from "./receipt";

/** Judul bagian, tebal. */
function section(title: string): string {
  return `${CMD.boldOn}${title}${CMD.boldOff}`;
}

/**
 * Laporan ringkas di printer thermal (58 / 80 mm):
 * ringkasan angka, metode bayar, tipe pesanan, dan semua menu (terjual maupun tidak) per kategori.
 */
export function buildReportReceipt(report: Report, meta: ReportMeta, store: ReceiptStore, menuSales: MenuSalesGroup[]): string {
  const width = charsPerLine(store.paper_size);
  const out: string[] = [...header(store, width), divider(width)];

  out.push(CMD.alignCenter, `${CMD.boldOn}LAPORAN PENJUALAN${CMD.boldOff}`, meta.kind.toUpperCase(), ...center(meta.periodShort, width), CMD.alignLeft);
  out.push(divider(width));

  out.push(section("RINGKASAN"));
  out.push(...row("Omzet", formatRupiah(report.omzet), width));
  out.push(...row("HPP", formatRupiah(report.hpp), width));
  out.push(...row("Pengeluaran", formatRupiah(report.expenses), width));
  out.push(`${CMD.boldOn}${row("Laba Sederhana", formatRupiah(report.profit), width).join("\n")}${CMD.boldOff}`);
  out.push(...row("Jumlah Order", String(report.transactions), width));
  out.push(
    ...row("Order Dibatalkan", report.cancelledCount ? `${report.cancelledCount} (${formatRupiah(report.cancelledValue)})` : "0", width),
  );
  out.push(...row("Uang Diterima*", formatRupiah(report.collected), width));
  out.push(divider(width));

  out.push(section("METODE BAYAR"));
  if (report.payments.length === 0) out.push("-");
  for (const p of report.payments) out.push(...row(`${paymentLabel(p.key)} (${p.count}x)`, formatRupiah(p.amount), width));
  out.push(divider(width));

  out.push(section("TIPE PESANAN"));
  if (report.orderTypes.length === 0) out.push("-");
  for (const t of report.orderTypes) out.push(...row(`${orderTypeLabel(t.key)} (${t.count}x)`, formatRupiah(t.amount), width));
  out.push(divider(width));

  out.push(section("PENJUALAN PER MENU"));
  if (menuSales.length === 0) out.push("-");
  for (const g of menuSales) {
    out.push(`${CMD.boldOn}${row(`${g.category} (${g.qty})`, formatRupiah(g.revenue), width).join("\n")}${CMD.boldOff}`);
    for (const r of g.rows) out.push(...row(`- ${r.name} (${r.qty})`, r.qty ? formatRupiah(r.revenue) : "-", width));
  }
  out.push(divider(width));

  out.push("*termasuk pajak & service");
  out.push(...row("Dicetak", formatDateTime(meta.printedAt), width));
  out.push(CMD.alignCenter, "TemanPOS", CMD.alignLeft);
  return joinLines(out);
}
