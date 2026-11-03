import { describe, expect, it } from "vitest";
import type { MenuSalesGroup, Report } from "@/lib/report";
import { buildReportReceipt } from "@/lib/printer/reportReceipt";
import { buildReportHtml, reportFileName, reportMeta, salesRowLabel } from "../reportExport";

const report: Report = {
  omzet: 150000,
  transactions: 3,
  average: 50000,
  hpp: 60000,
  expenses: 20000,
  profit: 70000,
  collected: 165000,
  cancelledCount: 1,
  cancelledValue: 25000,
  sales: [
    { label: "10", value: 0 },
    { label: "11", value: 150000 },
  ],
  peakHours: [],
  topMenus: [{ name: "Kopi <Susu>", qty: 4, revenue: 80000 }],
  payments: [{ key: "cash", amount: 110000, count: 2, percent: 66.7 }],
  orderTypes: [{ key: "gofood", amount: 55000, count: 1, percent: 33.3 }],
};

const printedAt = new Date(2026, 10, 3, 21, 5);

const menuSales: MenuSalesGroup[] = [
  {
    category: "Minuman",
    qty: 4,
    revenue: 80000,
    rows: [
      { name: "Kopi <Susu>", qty: 4, revenue: 80000 },
      { name: "Teh Tawar", qty: 0, revenue: 0 },
    ],
  },
];

describe("reportMeta & reportFileName", () => {
  it("harian", () => {
    const meta = reportMeta("Kopi Dsako!", { type: "today", anchor: new Date(2026, 10, 3) }, { from: "2026-11-03", to: "2026-11-03" }, printedAt);
    expect(meta.kind).toBe("Harian");
    expect(meta.periodText).toBe("3 November 2026");
    expect(reportFileName(meta)).toBe("Laporan_Kopi-Dsako_2026-11-03.pdf");
  });

  it("mingguan", () => {
    const meta = reportMeta("Kopi Dsako", { type: "week", anchor: new Date(2026, 10, 3) }, { from: "2026-11-02", to: "2026-11-08" }, printedAt);
    expect(meta.periodText).toBe("2 November 2026 – 8 November 2026");
    expect(meta.periodShort).toBe("2 Nov 2026 - 8 Nov 2026");
    expect(reportFileName(meta)).toBe("Laporan_Kopi-Dsako_2026-11-02_sd_2026-11-08.pdf");
  });

  it("bulanan & nama toko kosong", () => {
    const meta = reportMeta("  ", { type: "month", anchor: new Date(2026, 10, 1) }, { from: "2026-11-01", to: "2026-11-30" }, printedAt);
    expect(meta.periodText).toBe("November 2026");
    expect(reportFileName(meta)).toBe("Laporan_Toko_2026-11.pdf");
  });
});

describe("salesRowLabel", () => {
  it("per jam, per hari minggu, per tanggal bulan", () => {
    expect(salesRowLabel("today", "9", 0, "2026-11-03")).toBe("Jam 9:00");
    expect(salesRowLabel("week", "Sen", 0, "2026-11-02")).toBe("Senin, 2 Nov 2026");
    expect(salesRowLabel("month", "3", 2, "2026-11-01")).toBe("Selasa, 3 Nov 2026");
  });
});

describe("buildReportHtml", () => {
  const meta = reportMeta("Kopi & Teh", { type: "date", anchor: new Date(2026, 10, 3) }, { from: "2026-11-03", to: "2026-11-03" }, printedAt);
  const html = buildReportHtml(report, meta, [{ description: "Es batu", amount: 20000, method: "cash", expense_date: "2026-11-03" }], menuSales);

  it("berisi angka utama & label", () => {
    expect(html).toContain("Rp150.000");
    expect(html).toContain("Rp70.000");
    expect(html).toContain("Tunai");
    expect(html).toContain("GoFood");
    expect(html).toContain("Es batu");
    expect(html).toContain("Jam 11:00");
    expect(html).not.toContain("Jam 10:00"); // jam tanpa penjualan tidak ditampilkan
    expect(html).toContain("Penjualan per Menu");
    expect(html).toContain("Teh Tawar"); // menu tidak terjual tetap ada
  });

  it("teks dari pengguna di-escape", () => {
    expect(html).toContain("Kopi &amp; Teh");
    expect(html).toContain("Kopi &lt;Susu&gt;");
    expect(html).not.toContain("<Susu>");
  });
});

describe("buildReportReceipt", () => {
  it("muat di kertas 58mm dan berisi ringkasan", () => {
    const meta = reportMeta("Kopi Dsako", { type: "today", anchor: new Date(2026, 10, 3) }, { from: "2026-11-03", to: "2026-11-03" }, printedAt);
    const text = buildReportReceipt(report, meta, { name: "Kopi Dsako", address: null, phone: null, receipt_footer: "", paper_size: "58" }, menuSales);
    const plain = text.replace(/\x1b[a-zA-Z@!][\x00-\x11]?|\x1d![\x00-\x11]/g, "");
    expect(plain).toContain("LAPORAN PENJUALAN");
    expect(plain).toContain("Laba Sederhana");
    expect(plain).toContain("Rp70.000");
    expect(plain).toContain("PENJUALAN PER MENU");
    expect(plain).toContain("- Teh Tawar (0)");
    for (const line of plain.split("\n")) expect(line.length).toBeLessThanOrEqual(32);
  });
});
