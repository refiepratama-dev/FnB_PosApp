/**
 * Bahan cetak laporan (struk & PDF): judul periode, nama file PDF, dan isi HTML PDF.
 * Fungsi murni (tanpa React Native) supaya mudah dites.
 */
import { OJOL_PROVIDER_LABEL, ORDER_TYPE_LABEL, PAYMENT_METHOD_LABEL } from "@/constants/labels";
import { formatDate, formatDateLong, formatDateTime, formatMonth, formatRupiah } from "@/lib/format";
import type { DateRange, Period } from "@/lib/period";
import type { MenuSalesGroup, OrderTypeKey, Report } from "@/lib/report";
import type { Expense, PaymentMethod } from "@/types/database";

export const TYPE_LABEL: Record<OrderTypeKey, string> = {
  dine_in: ORDER_TYPE_LABEL.dine_in,
  takeaway: ORDER_TYPE_LABEL.takeaway,
  ...OJOL_PROVIDER_LABEL,
};

export function paymentLabel(key: string): string {
  return PAYMENT_METHOD_LABEL[key as PaymentMethod] ?? key;
}

export function orderTypeLabel(key: string): string {
  return TYPE_LABEL[key as OrderTypeKey] ?? key;
}

/** Keterangan periode yang dicetak. */
export type ReportMeta = {
  storeName: string;
  /** "Harian" / "Mingguan" / "Bulanan" */
  kind: string;
  /** "3 November 2026" / "2 November 2026 – 8 November 2026" / "November 2026" (untuk PDF) */
  periodText: string;
  /** "3 Nov 2026" / "2 Nov 2026 - 8 Nov 2026" / "November 2026" (muat 1 baris struk 58mm) */
  periodShort: string;
  range: DateRange;
  periodType: Period["type"];
  printedAt: Date;
};

function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function reportMeta(storeName: string, period: Period, range: DateRange, printedAt = new Date()): ReportMeta {
  const base = { storeName, range, periodType: period.type, printedAt };
  const from = isoToDate(range.from);
  const to = isoToDate(range.to);
  if (period.type === "month") return { ...base, kind: "Bulanan", periodText: formatMonth(from), periodShort: formatMonth(from) };
  if (period.type === "week") {
    return {
      ...base,
      kind: "Mingguan",
      periodText: `${formatDateLong(from)} – ${formatDateLong(to)}`,
      periodShort: `${formatDate(from)} - ${formatDate(to)}`,
    };
  }
  return { ...base, kind: "Harian", periodText: formatDateLong(from), periodShort: formatDate(from) };
}

/** "Kopi Dsako!" -> "Kopi-Dsako" (aman untuk nama file di semua HP & WhatsApp). */
function slug(text: string): string {
  const s = text
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-");
  return s || "Toko";
}

/**
 * Nama file PDF:
 *   harian   -> Laporan_Kopi-Dsako_2026-11-03.pdf
 *   mingguan -> Laporan_Kopi-Dsako_2026-11-02_sd_2026-11-08.pdf
 *   bulanan  -> Laporan_Kopi-Dsako_2026-11.pdf
 */
export function reportFileName(meta: Pick<ReportMeta, "storeName" | "periodType" | "range">): string {
  const store = slug(meta.storeName);
  const { from, to } = meta.range;
  const when = meta.periodType === "month" ? from.slice(0, 7) : from === to ? from : `${from}_sd_${to}`;
  return `Laporan_${store}_${when}.pdf`;
}

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/**
 * Label baris penjualan: harian "Jam 10:00", mingguan & bulanan "Senin, 2 Nov 2026".
 * index = urutan bar (bar mingguan/bulanan dimulai dari tanggal awal periode).
 */
export function salesRowLabel(periodType: Period["type"], label: string, index: number, from: string): string {
  if (periodType === "today" || periodType === "date") return `Jam ${label}:00`;
  const start = isoToDate(from);
  const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
  return `${DAYS[day.getDay()]}, ${formatDate(day)}`;
}

function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 284 288" width="34" height="34"><path fill="#006DB0" d="M100,78 H184 V242 A46,46 0 0 1 138,288 H100 V78 Z"/><path fill="#09AA29" d="M0,32 H50 A50,50 0 0 1 100,82 V110 H46 A46,46 0 0 1 0,64 V32 Z"/><path fill="#FE801A" d="M146,0 H284 V32 A48,48 0 0 1 236,80 H100 V46 A46,46 0 0 1 146,0 Z"/></svg>';

function table(head: string[], rows: string[][], alignRight: number[] = []): string {
  if (rows.length === 0) return '<p class="empty">Belum ada data di periode ini.</p>';
  const cls = (i: number) => (alignRight.includes(i) ? ' class="r"' : "");
  return `<table><thead><tr>${head.map((h, i) => `<th${cls(i)}>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c, i) => `<td${cls(i)}>${c}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

/** Isi PDF laporan (A4) dengan gaya TemanPOS. */
export function buildReportHtml(
  report: Report,
  meta: ReportMeta,
  expenses: Pick<Expense, "description" | "amount" | "method" | "expense_date">[],
  menuSales: MenuSalesGroup[],
): string {
  const kpi = (label: string, value: string, tone = "") => `<div class="kpi ${tone}"><div class="kl">${esc(label)}</div><div class="kv">${esc(value)}</div></div>`;
  const sales = report.sales
    .map((b, i) => ({ ...b, i }))
    .filter((b) => b.value > 0)
    .map((b) => [esc(salesRowLabel(meta.periodType, b.label, b.i, meta.range.from)), formatRupiah(b.value)]);
  const menuRows = menuSales.flatMap((g) => [
    `<tr class="grp"><td>${esc(g.category)}</td><td class="r">${g.qty}</td><td class="r">${formatRupiah(g.revenue)}</td></tr>`,
    ...g.rows.map(
      (r) =>
        `<tr${r.qty === 0 ? ' class="zero"' : ""}><td class="ind">${esc(r.name)}</td><td class="r">${r.qty}</td><td class="r">${r.qty ? formatRupiah(r.revenue) : "-"}</td></tr>`,
    ),
  ]);
  const sortedExpenses = [...expenses].sort((a, b) => (a.expense_date < b.expense_date ? -1 : a.expense_date > b.expense_date ? 1 : 0));

  return `<!doctype html><html lang="id"><head><meta charset="utf-8"/><title>${esc(reportFileName(meta))}</title><style>
@page { size: A4; margin: 14mm 14mm 16mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Roboto, "Segoe UI", -apple-system, Arial, sans-serif; color: #101828; font-size: 11px; line-height: 1.45; }
.head { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 2px solid #006DB0; }
.logo { display: flex; align-items: center; gap: 8px; }
.wm { font-size: 18px; font-weight: 700; color: #0B2545; letter-spacing: -0.2px; }
.wm span { color: #006DB0; }
.store { font-size: 12px; color: #667085; margin-top: 2px; }
.title { text-align: right; }
.title h1 { margin: 0; font-size: 18px; color: #0B2545; }
.title .p { font-size: 12px; color: #101828; font-weight: 600; margin-top: 2px; }
.title .k { display: inline-block; margin-top: 4px; padding: 2px 10px; border-radius: 99px; background: #FFF1E5; color: #A84A06; font-size: 10px; font-weight: 700; }
h2 { font-size: 13px; color: #0B2545; margin: 18px 0 8px; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 14px; }
.kpi { border: 1px solid #E4E7EC; border-radius: 12px; padding: 10px 12px; }
.kl { font-size: 10px; color: #667085; }
.kv { font-size: 16px; font-weight: 700; margin-top: 2px; }
.kpi.brand { background: #006DB0; border-color: #006DB0; }
.kpi.brand .kl { color: #E3F1FA; } .kpi.brand .kv { color: #fff; }
.kpi.good .kv { color: #067D1E; } .kpi.bad .kv { color: #D92D20; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; font-size: 10px; color: #667085; font-weight: 600; padding: 6px 8px; background: #F5F6F8; border-bottom: 1px solid #E4E7EC; }
td { padding: 6px 8px; border-bottom: 1px solid #E4E7EC; }
tr { page-break-inside: avoid; }
.r { text-align: right; }
.empty { color: #667085; font-style: italic; margin: 0; }
tr.grp td { background: #E3F1FA; color: #00578D; font-weight: 700; }
td.ind { padding-left: 18px; }
tr.zero td { color: #98A2B3; }
.note { color: #667085; font-size: 9.5px; margin-top: 6px; }
.foot { margin-top: 22px; padding-top: 8px; border-top: 1px solid #E4E7EC; color: #667085; font-size: 9.5px; display: flex; justify-content: space-between; }
</style></head><body>
<div class="head">
  <div><div class="logo">${LOGO_SVG}<div class="wm">Teman<span>POS</span></div></div><div class="store">${esc(meta.storeName)}</div></div>
  <div class="title"><h1>Laporan Penjualan</h1><div class="p">${esc(meta.periodText)}</div><div class="k">${esc(meta.kind.toUpperCase())}</div></div>
</div>

<div class="grid">
  ${kpi("Omzet", formatRupiah(report.omzet), "brand")}
  ${kpi("Laba Sederhana", formatRupiah(report.profit), report.profit >= 0 ? "good" : "bad")}
  ${kpi("HPP", formatRupiah(report.hpp))}
  ${kpi("Total Pengeluaran", formatRupiah(report.expenses))}
  ${kpi("Jumlah Order", String(report.transactions))}
  ${kpi("Order Dibatalkan", `${report.cancelledCount}${report.cancelledCount ? ` · ${formatRupiah(report.cancelledValue)}` : ""}`, report.cancelledCount ? "bad" : "")}
</div>
<p class="note">Omzet tanpa pajak & service. Laba sederhana = Omzet − HPP − Pengeluaran. Total uang diterima (termasuk pajak & service): ${formatRupiah(report.collected)}.</p>

<div class="two">
  <div><h2>Metode Bayar</h2>${table(["Metode", "Transaksi", "Jumlah"], report.payments.map((p) => [esc(paymentLabel(p.key)), `${p.count}x`, formatRupiah(p.amount)]), [1, 2])}</div>
  <div><h2>Tipe Pesanan</h2>${table(["Tipe", "Transaksi", "Jumlah"], report.orderTypes.map((t) => [esc(orderTypeLabel(t.key)), `${t.count}x`, formatRupiah(t.amount)]), [1, 2])}</div>
</div>

<div class="two">
  <div><h2>Menu Terlaris (5 Teratas)</h2>${table(["Menu", "Porsi", "Penjualan"], report.topMenus.map((m) => [esc(m.name), String(m.qty), formatRupiah(m.revenue)]), [1, 2])}</div>
  <div><h2>${meta.periodType === "today" || meta.periodType === "date" ? "Penjualan per Jam" : "Penjualan per Hari"}</h2>${table(["Waktu", "Omzet"], sales, [1])}</div>
</div>

<h2>Penjualan per Menu (semua menu)</h2>
${
  menuRows.length
    ? `<table><thead><tr><th>Menu</th><th class="r">Porsi</th><th class="r">Penjualan</th></tr></thead><tbody>${menuRows.join("")}</tbody></table>`
    : '<p class="empty">Belum ada menu.</p>'
}
<p class="note">Menu yang tidak terjual di periode ini tetap ditampilkan (0 porsi).</p>

<h2>Pengeluaran</h2>
${table(
  ["Tanggal", "Keterangan", "Metode", "Jumlah"],
  sortedExpenses.map((e) => [esc(formatDateLong(isoToDate(e.expense_date))), esc(e.description), e.method === "cash" ? "Tunai" : "Transfer", formatRupiah(e.amount)]),
  [3],
)}

<div class="foot"><span>Dicetak ${esc(formatDateTime(meta.printedAt))}</span><span>Dibuat dengan TemanPOS</span></div>
</body></html>`;
}
