import { describe, expect, it } from "vitest";
import { CMD, charsPerLine, row, sanitize, wrap } from "@/lib/printer/escpos";
import { buildReceipt, buildTestPage } from "@/lib/printer/receipt";
import type { Order, OrderItem } from "@/types/database";

/** Buang perintah ESC/POS supaya yang tersisa teks yang tercetak. */
const visible = (s: string) => s.replace(/\x1b[a-zA-Z@][\x00-\x02]?|\x1d!./g, "");

describe("escpos helpers", () => {
  it("lebar kertas", () => {
    expect(charsPerLine("58")).toBe(32);
    expect(charsPerLine("80")).toBe(48);
  });

  it("row rata kiri-kanan pas selebar kertas", () => {
    const [line] = row("Nasi Goreng", "Rp15.000", 32);
    expect(line).toHaveLength(32);
    expect(line.startsWith("Nasi Goreng")).toBe(true);
    expect(line.endsWith("Rp15.000")).toBe(true);
  });

  it("row memecah nama panjang, harga di baris terakhir", () => {
    const lines = row("2x Steak Sirloin Saus Lada Hitam Spesial", "Rp150.000", 32);
    expect(lines.length).toBeGreaterThan(1);
    lines.forEach((l) => expect(l.length).toBeLessThanOrEqual(32));
    expect(lines.at(-1)!.endsWith("Rp150.000")).toBe(true);
  });

  it("wrap tidak melebihi lebar & memotong kata super panjang", () => {
    const lines = wrap("a".repeat(40) + " halo dunia", 16);
    lines.forEach((l) => expect(l.length).toBeLessThanOrEqual(16));
    expect(lines.join("")).toContain("halo");
  });

  it("sanitize membuang emoji & mengganti tanda kutip miring", () => {
    expect(sanitize("Di’Sako ✓ café 🍔")).toBe("Di'Sako  cafe ");
  });
});

const order: Order = {
  id: "o1",
  order_number: "TP-261101-007",
  business_date: "2026-11-01",
  daily_seq: 7,
  order_type: "dine_in",
  ojol_provider: null,
  ojol_order_ref: null,
  table_number: "5",
  customer_name: null,
  member_id: null,
  member_name: "Budi",
  subtotal: 100000,
  discount_percent: 10,
  discount_amount: 10000,
  service_amount: 4500,
  tax_amount: 9450,
  total: 103950,
  payment_method: "qris",
  ojol_cash_source: null,
  status: "paid",
  cancel_reason: null,
  cancelled_at: null,
  created_by_mode: "cashier",
  created_at: "2026-11-01T12:30:00+07:00",
};

const items: OrderItem[] = [
  {
    id: "i1",
    order_id: "o1",
    menu_item_id: "m1",
    name: "Sirloin Steak",
    unit_price: 45000,
    cost_price: 20000,
    qty: 2,
    note: "Tanpa bawang",
    options: [{ group: "Kematangan", name: "Medium", price_delta: 0 }, { group: "Topping", name: "Keju", price_delta: 5000 }],
    line_total: 100000,
  },
];

const store = {
  name: "Di`Sako Steak",
  address: "Jl. Merdeka No. 1, Palembang",
  phone: "0812345678",
  receipt_footer: "Terima kasih!",
  paper_size: "58" as const,
};

describe("buildReceipt", () => {
  const text = buildReceipt(order, items, store);
  const lines = visible(text).split("\n");

  it("tidak ada baris yang melebihi 32 huruf (58mm)", () => {
    lines.forEach((l) => expect(l.length).toBeLessThanOrEqual(32));
  });

  it("berisi info penting order", () => {
    const plain = visible(text);
    for (const s of ["TP-261101-007", "Dine-in - Meja 5", "Pelanggan: Budi", "2x Sirloin Steak", "- Keju +Rp5.000",
      "Catatan: Tanpa bawang", "Diskon 10%", "-Rp10.000", "Service", "Pajak", "TOTAL", "Rp103.950", "QRIS", "Terima kasih!"]) {
      expect(plain).toContain(s);
    }
  });

  it("tidak menampilkan baris diskon/pajak kalau nol", () => {
    const plain = visible(buildReceipt({ ...order, discount_amount: 0, tax_amount: 0, service_amount: 0 }, items, store));
    expect(plain).not.toContain("Diskon");
    expect(plain).not.toContain("Pajak");
    expect(plain).not.toContain("Service");
  });

  it("order ojol menampilkan provider & nomor order ojol", () => {
    const plain = visible(
      buildReceipt({ ...order, order_type: "ojol", ojol_provider: "gofood", ojol_order_ref: "F-123", table_number: null }, items, store),
    );
    expect(plain).toContain("GoFood #F-123");
  });

  it("order batal diberi tanda", () => {
    expect(visible(buildReceipt({ ...order, status: "cancelled" }, items, store))).toContain("DIBATALKAN");
  });

  it("80mm memakai 48 huruf", () => {
    const wide = visible(buildReceipt(order, items, { ...store, paper_size: "80" })).split("\n");
    expect(Math.max(...wide.map((l) => l.length))).toBe(48);
  });

  it("perintah tebal selalu dimatikan lagi", () => {
    const on = text.split(CMD.boldOn).length;
    const off = text.split(CMD.boldOff).length;
    expect(on).toBe(off);
  });
});

describe("buildTestPage", () => {
  it("penggaris pas selebar kertas", () => {
    const plain = visible(buildTestPage({ name: "Toko" }, "58", "Iware")).split("\n");
    expect(plain).toContain("12345678901234567890123456789012");
    plain.forEach((l) => expect(l.length).toBeLessThanOrEqual(32));
  });
});
