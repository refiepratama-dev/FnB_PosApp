import { describe, expect, it } from "vitest";
import type { Order } from "@/types/database";
import { dateLabel, groupOrdersByDate } from "../orderGroups";

const make = (id: string, date: string, status: "paid" | "cancelled", subtotal = 10000, discount = 0) =>
  ({ id, business_date: date, status, subtotal, discount_amount: discount }) as Order;

describe("groupOrdersByDate", () => {
  const orders = [
    make("a", "2026-11-02", "paid", 20000, 2000),
    make("b", "2026-11-02", "cancelled", 50000),
    make("c", "2026-11-01", "paid"),
    make("d", "2026-10-28", "paid"),
    make("e", "2026-11-02", "paid"),
  ];
  const sections = groupOrdersByDate(orders, "2026-11-02");

  it("tanggal terbaru di atas", () => {
    expect(sections.map((s) => s.date)).toEqual(["2026-11-02", "2026-11-01", "2026-10-28"]);
  });

  it("judul Hari ini / Kemarin / tanggal biasa", () => {
    expect(sections[0].title).toBe("Hari ini · Senin, 2 Nov 2026");
    expect(sections[1].title).toBe("Kemarin · Minggu, 1 Nov 2026");
    expect(sections[2].title).toBe("Rabu, 28 Okt 2026");
  });

  it("ringkasan per hari hanya menghitung order lunas", () => {
    expect(sections[0].paidCount).toBe(2);
    expect(sections[0].omzet).toBe(18000 + 10000);
    expect(sections[0].data.map((o) => o.id)).toEqual(["a", "b", "e"]);
  });

  it("label tanggal tidak bergeser zona waktu", () => {
    expect(dateLabel("2026-01-01")).toBe("Kamis, 1 Jan 2026");
  });
});
