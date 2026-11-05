import { describe, expect, it } from "vitest";
import { sortMenuItemsByCategory } from "../menu";

const categories = [
  { id: "drinks", sort_order: 2 },
  { id: "food", sort_order: 1 },
];

describe("sortMenuItemsByCategory", () => {
  it("orders categories by their configured order, then menus by their order within each category", () => {
    const items = [
      { id: "tea", category_id: "drinks", sort_order: 1, name: "Teh" },
      { id: "rice", category_id: "food", sort_order: 2, name: "Nasi" },
      { id: "coffee", category_id: "drinks", sort_order: 0, name: "Kopi" },
      { id: "snack", category_id: "food", sort_order: 1, name: "Snack" },
    ];

    expect(sortMenuItemsByCategory(items, categories).map((item) => item.id)).toEqual([
      "snack",
      "rice",
      "coffee",
      "tea",
    ]);
  });

  it("places uncategorized and unknown-category menus after active categories", () => {
    const items = [
      { id: "none", category_id: null, sort_order: 2, name: "Tanpa kategori" },
      { id: "categorized", category_id: "food", sort_order: 4, name: "Makanan" },
      { id: "archived", category_id: "archived", sort_order: 1, name: "Kategori lama" },
    ];

    expect(sortMenuItemsByCategory(items, categories).map((item) => item.id)).toEqual([
      "categorized",
      "archived",
      "none",
    ]);
  });

  it("uses the Indonesian menu name as a deterministic tie-breaker", () => {
    const items = [
      { id: "tea", category_id: "food", sort_order: 1, name: "Teh" },
      { id: "coffee", category_id: "food", sort_order: 1, name: "Kopi" },
    ];

    expect(sortMenuItemsByCategory(items, categories).map((item) => item.name)).toEqual(["Kopi", "Teh"]);
  });
});
