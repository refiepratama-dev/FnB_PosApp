import { describe, expect, it } from "vitest";
import type { Expense } from "@/types/database";
import { groupExpensesByDate } from "../expenseGroups";

function expense(id: string, expense_date: string, amount: number): Expense {
  return {
    id,
    description: `Beli ${id}`,
    amount,
    method: "cash",
    receipt_image_url: null,
    expense_date,
    created_at: `${expense_date}T09:00:00Z`,
    updated_at: `${expense_date}T09:00:00Z`,
  };
}

describe("groupExpensesByDate", () => {
  it("mengelompokkan per tanggal, terbaru di atas, dengan total per hari", () => {
    const sections = groupExpensesByDate(
      [expense("a", "2026-11-01", 5000), expense("b", "2026-11-03", 20000), expense("c", "2026-11-03", 10000), expense("d", "2026-11-02", 7000)],
      "2026-11-03",
    );
    expect(sections.map((s) => s.date)).toEqual(["2026-11-03", "2026-11-02", "2026-11-01"]);
    expect(sections[0].title).toBe("Hari ini · Selasa, 3 Nov 2026");
    expect(sections[1].title).toBe("Kemarin · Senin, 2 Nov 2026");
    expect(sections[2].title).toBe("Minggu, 1 Nov 2026");
    expect(sections[0].total).toBe(30000);
    expect(sections[0].data.map((e) => e.id)).toEqual(["b", "c"]);
  });

  it("daftar kosong menghasilkan section kosong", () => {
    expect(groupExpensesByDate([], "2026-11-03")).toEqual([]);
  });
});
