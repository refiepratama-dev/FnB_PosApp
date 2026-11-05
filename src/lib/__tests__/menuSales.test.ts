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
      { name: "Kopi Susu", qty: 2, revenue: 36000, variants: [], toppings: [] },
      { name: "Es Teh", qty: 1, revenue: 5000, variants: [], toppings: [] },
    ]);
    expect(groups[1].rows).toEqual([{ name: "Nasi Goreng", qty: 0, revenue: 0, variants: [], toppings: [] }]); // order batal tidak dihitung
    expect(groups[2].rows).toEqual([{ name: "Kerupuk", qty: 0, revenue: 0, variants: [], toppings: [] }]);
    expect(groups[3].rows).toEqual([{ name: "Jus Lama", qty: 1, revenue: 12000, variants: [], toppings: [] }]);
  });

  it("total per kategori", () => {
    expect(groups[0].qty).toBe(3);
    expect(groups[0].revenue).toBe(41000);
  });
});

describe("buildMenuSales: varian & topping", () => {
  const withOptions = (items: { menu_item_id: string | null; name: string; qty: number; unit_price: number; options: { group: string; name: string; price_delta: number }[] }[]) =>
    ({ status: "paid", order_items: items.map((i) => ({ ...i, cost_price: 0 })) }) as unknown as OrderWithItems;

  const optionMenus = [
    {
      id: "m2",
      name: "Kopi Susu",
      category_id: "c1",
      option_groups: [
        { name: "Ukuran", type: "variant" as const },
        { name: "Tambahan", type: "addon" as const },
      ],
    },
  ];
  const large = { group: "Ukuran", name: "Large", price_delta: 5000 };
  const regular = { group: "Ukuran", name: "Regular", price_delta: 0 };
  const boba = { group: "Tambahan", name: "Boba", price_delta: 3000 };
  const cheese = { group: "Tambahan", name: "Cheese Foam", price_delta: 4000 };

  const groups = buildMenuSales(
    [
      withOptions([
        { menu_item_id: "m2", name: "Kopi Susu", qty: 2, unit_price: 23000, options: [large, boba] },
        { menu_item_id: "m2", name: "Kopi Susu", qty: 4, unit_price: 18000, options: [regular] },
      ]),
      withOptions([{ menu_item_id: "m2", name: "Kopi Susu", qty: 1, unit_price: 27000, options: [large, boba, cheese] }]),
      { status: "cancelled", order_items: [{ menu_item_id: "m2", name: "Kopi Susu", qty: 9, unit_price: 1, cost_price: 0, options: [large] }] } as unknown as OrderWithItems,
    ],
    optionMenus,
    categories,
  );
  const kopi = groups[0].rows[0];

  it("jumlah varian = jumlah pilihan x qty item, paling banyak dulu", () => {
    expect(kopi.qty).toBe(7);
    expect(kopi.variants).toEqual([
      { name: "Regular", qty: 4 },
      { name: "Large", qty: 3 }, // 2 + 1, order batal tidak dihitung
    ]);
  });

  it("topping dipisah dari varian", () => {
    expect(kopi.toppings).toEqual([
      { name: "Boba", qty: 3 },
      { name: "Cheese Foam", qty: 1 },
    ]);
  });

  it("menu yang sudah dihapus: jenis pilihan ditebak dari nama grup", () => {
    const deleted = buildMenuSales(
      [withOptions([{ menu_item_id: "old", name: "Jus Lama", qty: 2, unit_price: 12000, options: [large, { group: "Topping", name: "Jelly", price_delta: 2000 }] }])],
      [],
      [],
    );
    expect(deleted[0].rows[0].variants).toEqual([{ name: "Large", qty: 2 }]);
    expect(deleted[0].rows[0].toppings).toEqual([{ name: "Jelly", qty: 2 }]);
  });

  it("order lama tanpa kolom options tidak error", () => {
    const old = buildMenuSales([{ status: "paid", order_items: [{ menu_item_id: "m2", name: "Kopi Susu", qty: 1, unit_price: 18000, cost_price: 0 }] } as unknown as OrderWithItems], optionMenus, categories);
    expect(old[0].rows[0]).toMatchObject({ qty: 1, variants: [], toppings: [] });
  });
});
