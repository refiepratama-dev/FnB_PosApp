import { describe, expect, it } from "vitest";
import { digitsOnly, parseAmount } from "../amount";
import { newId } from "../ids";
import {
  buildRows,
  newDraftGroup,
  summarizeOptions,
  toDraftGroups,
  validateDraftGroups,
  type DraftGroup,
} from "../optionDraft";

function group(overrides: Partial<DraftGroup> = {}): DraftGroup {
  return {
    key: "g1",
    name: "Ukuran",
    type: "variant",
    required: true,
    maxSelect: 1,
    options: [
      { key: "o1", name: "Regular", price: "" },
      { key: "o2", name: "Large", price: "5000" },
    ],
    ...overrides,
  };
}

describe("amount", () => {
  it("hanya angka", () => {
    expect(digitsOnly("Rp 15.000")).toBe("15000");
    expect(parseAmount("15.000")).toBe(15000);
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });
});

describe("newId", () => {
  it("berbentuk UUID v4 dan unik", () => {
    const id = newId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(newId()).not.toBe(id);
  });
});

describe("validateDraftGroups", () => {
  it("lolos kalau semua benar", () => {
    expect(validateDraftGroups([group()])).toBeNull();
    expect(validateDraftGroups([])).toBeNull();
  });
  it("nama grup wajib & tidak boleh dobel", () => {
    expect(validateDraftGroups([group({ name: " " })])).toMatch(/belum diisi/);
    expect(validateDraftGroups([group(), group({ key: "g2", name: "ukuran" })])).toMatch(/dobel/);
  });
  it("pilihan wajib ada, bernama, dan tidak dobel", () => {
    expect(validateDraftGroups([group({ options: [] })])).toMatch(/belum punya pilihan/);
    expect(validateDraftGroups([group({ options: [{ key: "x", name: "", price: "" }] })])).toMatch(/masih kosong/);
    expect(
      validateDraftGroups([
        group({
          options: [
            { key: "a", name: "Es", price: "" },
            { key: "b", name: "es", price: "" },
          ],
        }),
      ]),
    ).toMatch(/dobel/);
  });
  it("harga tambahan terlalu besar ditolak", () => {
    expect(validateDraftGroups([group({ options: [{ key: "x", name: "Mahal", price: "999999999" }] })])).toMatch(
      /terlalu besar/,
    );
  });
});

describe("buildRows", () => {
  it("varian: wajib & pilih 1; urutan dan harga terisi", () => {
    const { groups, options } = buildRows("menu-1", [group({ required: false, maxSelect: 5 })]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ menu_item_id: "menu-1", name: "Ukuran", is_required: true, max_select: 1, sort_order: 1 });
    expect(options.map((o) => [o.name, o.price_delta, o.sort_order])).toEqual([
      ["Regular", 0, 1],
      ["Large", 5000, 2],
    ]);
    expect(options.every((o) => o.group_id === groups[0].id)).toBe(true);
  });
  it("topping: max_select dibatasi jumlah pilihan", () => {
    const addon = group({ type: "addon", required: false, maxSelect: 9 });
    const { groups } = buildRows("menu-1", [addon]);
    expect(groups[0]).toMatchObject({ type: "addon", is_required: false, max_select: 2 });
  });
});

describe("toDraftGroups & summarizeOptions", () => {
  it("urut sesuai sort_order dan harga 0 tampil kosong", () => {
    const drafts = toDraftGroups([
      {
        id: "g2", menu_item_id: "m", name: "Tambahan", type: "addon", is_required: false, max_select: 2, sort_order: 2,
        options: [{ id: "o1", group_id: "g2", name: "Telur", price_delta: 5000, sort_order: 1 }],
      },
      {
        id: "g1", menu_item_id: "m", name: "Saus", type: "variant", is_required: true, max_select: 1, sort_order: 1,
        options: [
          { id: "o3", group_id: "g1", name: "BBQ", price_delta: 0, sort_order: 2 },
          { id: "o2", group_id: "g1", name: "Mushroom", price_delta: 0, sort_order: 1 },
        ],
      },
    ]);
    expect(drafts.map((g) => g.name)).toEqual(["Saus", "Tambahan"]);
    expect(drafts[0].options.map((o) => o.name)).toEqual(["Mushroom", "BBQ"]);
    expect(drafts[0].options[0].price).toBe("");
    expect(drafts[1].options[0].price).toBe("5000");
  });
  it("ringkasan", () => {
    expect(summarizeOptions(undefined)).toBe("");
    expect(summarizeOptions([{ type: "variant" }, { type: "variant" }, { type: "addon" }])).toBe("2 varian · 1 topping");
    expect(newDraftGroup("addon").required).toBe(false);
  });
});

describe("groupThousands (kolom harga)", () => {
  it("memberi titik pemisah ribuan", async () => {
    const { groupThousands } = await import("../amount");
    expect(groupThousands("")).toBe("");
    expect(groupThousands("500")).toBe("500");
    expect(groupThousands("15000")).toBe("15.000");
    expect(groupThousands("1250000")).toBe("1.250.000");
    expect(groupThousands("15.000")).toBe("15.000"); // sudah bertitik tetap sama
  });
});
