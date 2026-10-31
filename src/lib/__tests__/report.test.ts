import { describe, expect, it } from "vitest";
import type { OrderWithItems } from "@/types/database";
import { buildReport } from "../report";

let seq = 0;
function order(p: Partial<OrderWithItems> & { items?: { name: string; qty: number; unit_price: number; cost_price?: number }[] }): OrderWithItems {
  seq += 1;
  const items = (p.items ?? [{ name: "Kopi", qty: 1, unit_price: 10000, cost_price: 4000 }]).map((i, n) => ({
    id: `i${seq}-${n}`,
    order_id: `o${seq}`,
    menu_item_id: null,
    note: null,
    options: [],
    cost_price: i.cost_price ?? 0,
    line_total: i.unit_price * i.qty,
    ...i,
  }));
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.qty, 0);
  return {
    id: `o${seq}`, order_number: `TP-${seq}`, business_date: "2026-10-31", daily_seq: seq,
    order_type: "takeaway", ojol_provider: null, ojol_order_ref: null, table_number: null, customer_name: null,
    member_id: null, member_name: null, subtotal, discount_percent: 0, discount_amount: 0, service_amount: 0,
    tax_amount: 0, total: subtotal, payment_method: "cash", ojol_cash_source: null, status: "paid",
    cancel_reason: null, cancelled_at: null, created_by_mode: "cashier", created_at: new Date(2026, 9, 31, 12, 0).toISOString(),
    order_items: items, ...p,
  } as OrderWithItems;
}

const day = { from: "2026-10-31", to: "2026-10-31" };

describe("buildReport", () => {
  it("omzet tanpa pajak, laba = omzet - HPP - pengeluaran, order batal tidak dihitung", () => {
    const orders = [
      order({ items: [{ name: "Steak", qty: 2, unit_price: 50000, cost_price: 30000 }] }), // 100rb, HPP 60rb
      order({
        items: [{ name: "Kopi", qty: 1, unit_price: 20000, cost_price: 5000 }],
        discount_percent: 10, discount_amount: 2000, tax_amount: 1800, total: 19800,
      }), // omzet 18rb
      order({ status: "cancelled", items: [{ name: "Steak", qty: 1, unit_price: 50000, cost_price: 30000 }] }),
    ];
    const r = buildReport(orders, [{ amount: 25000 }], "today", day);
    expect(r.omzet).toBe(118000);
    expect(r.hpp).toBe(65000);
    expect(r.expenses).toBe(25000);
    expect(r.profit).toBe(28000);
    expect(r.transactions).toBe(2);
    expect(r.average).toBe(59000);
    expect(r.collected).toBe(119800);
    expect(r.cancelledCount).toBe(1);
    expect(r.cancelledValue).toBe(50000);
  });

  it("menu terlaris urut jumlah porsi", () => {
    const r = buildReport(
      [order({ items: [{ name: "Kopi", qty: 3, unit_price: 10000 }, { name: "Steak", qty: 1, unit_price: 50000 }] }), order({ items: [{ name: "Kopi", qty: 1, unit_price: 10000 }] })],
      [], "today", day,
    );
    expect(r.topMenus[0]).toEqual({ name: "Kopi", qty: 4, revenue: 40000 });
    expect(r.topMenus[1].name).toBe("Steak");
  });

  it("metode bayar & tipe pesanan dalam persen", () => {
    const r = buildReport(
      [
        order({ payment_method: "qris", items: [{ name: "A", qty: 1, unit_price: 30000 }] }),
        order({ payment_method: "cash", items: [{ name: "A", qty: 1, unit_price: 10000 }] }),
        order({ order_type: "ojol", ojol_provider: "gofood", payment_method: "ojol", items: [{ name: "A", qty: 1, unit_price: 60000 }] }),
      ],
      [], "today", day,
    );
    expect(r.payments.map((p) => [p.key, p.percent])).toEqual([["ojol", 60], ["qris", 30], ["cash", 10]]);
    expect(r.orderTypes.map((t) => t.key)).toEqual(["gofood", "takeaway"]);
  });

  it("grafik harian per jam (08-22), mingguan per hari Sen-Min, bulanan per tanggal", () => {
    const o = order({ created_at: new Date(2026, 9, 31, 19, 30).toISOString() });
    const daily = buildReport([o], [], "today", day);
    expect(daily.sales[0].label).toBe("08");
    expect(daily.sales.at(-1)!.label).toBe("22");
    expect(daily.sales.find((b) => b.label === "19")!.value).toBe(10000);
    expect(daily.peakHours.find((b) => b.label === "19")!.value).toBe(1);

    const weekly = buildReport([o], [], "week", { from: "2026-10-26", to: "2026-11-01" });
    expect(weekly.sales.map((b) => b.label)).toEqual(["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]);
    expect(weekly.sales[5].value).toBe(10000); // Sabtu 31 Okt

    const monthly = buildReport([o], [], "month", { from: "2026-10-01", to: "2026-10-31" });
    expect(monthly.sales).toHaveLength(31);
    expect(monthly.sales[30]).toEqual({ label: "31", value: 10000 });
  });

  it("grafik per jam melebar kalau ada order di luar jam 08-22", () => {
    const r = buildReport([order({ created_at: new Date(2026, 9, 31, 23, 10).toISOString() })], [], "today", day);
    expect(r.sales.at(-1)!.label).toBe("23");
  });

  it("data kosong tidak error", () => {
    const r = buildReport([], [], "month", { from: "2026-10-01", to: "2026-10-31" });
    expect(r.omzet).toBe(0);
    expect(r.average).toBe(0);
    expect(r.payments).toEqual([]);
  });
});
