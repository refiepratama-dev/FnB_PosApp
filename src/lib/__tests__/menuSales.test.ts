import { describe, expect, it } from "vitest";
import type { OrderWithItems } from "@/types/database";
import { buildMenuSales } from "../report";

function order(status: "paid" | "cancelled", items: { menu_item_id: string | null; name: string; qty: number; unit_price: number }[]) {
  return { status, order_items: items.map((i) => ({ ...i, cost_price: 0 })) } as unknown as OrderWithItems;
}

const categories = [
  { id: "c1", name: "Minuman" },
  { id: "c2", name: "Makanan" },
];
const menus = [
  { id: "m1", name: "Es Teh", category_id: "c1" },
  { id: "m2", name: "Kopi Susu", category_id: "c1" },
  { id: "m3", name: "Nasi Goreng", category_id: "c2" },
  { id: "m4", name: "Kerupuk", category_id: null },
];

describe("buildMenuSales", () => {
  const groups = buildMenuSales(
    [
      order("paid", [
        { menu_item_id: "m2", name: "Kopi Susu", qty: 2, unit_price: 18000 },
        { menu_item_id: null, name: "Es Teh", qty: 1, unit_price: 5000 }, // dicocokkan lewat nama
        { menu_item_id: "old", name: "Jus Lama", qty: 1, unit_price: 12000 }, // menu sudah dihapus
      ]),
      order("cancelled", [{ menu_item_id: "m3", name: "Nasi Goreng", qty: 5, unit_price: 20000 }]),
    ],
    menus,
    categories,
  );

  it("semua menu tampil per kategori, termasuk yang tidak terjual", () => {
    expect(groups.map((g) => g.category)).toEqual(["Minuman", "Makanan", "Tanpa kategori", "Menu dihapus"]);
    expect(groups[0].rows).toEqual([
      { name: "Kopi Susu", qty: 2, revenue: 36000 },
      { name: "Es Teh", qty: 1, revenue: 5000 },
    ]);
    expect(groups[1].rows).toEqual([{ name: "Nasi Goreng", qty: 0, revenue: 0 }]); // order batal tidak dihitung
    expect(groups[2].rows).toEqual([{ name: "Kerupuk", qty: 0, revenue: 0 }]);
    expect(groups[3].rows).toEqual([{ name: "Jus Lama", qty: 1, revenue: 12000 }]);
  });

  it("total per kategori", () => {
    expect(groups[0].qty).toBe(3);
    expect(groups[0].revenue).toBe(41000);
  });
});
