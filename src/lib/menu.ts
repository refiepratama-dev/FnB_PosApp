import type { Category, MenuItem } from "@/types/database";

type OrderedMenuItem = Pick<MenuItem, "category_id" | "sort_order" | "name">;
type OrderedCategory = Pick<Category, "id" | "sort_order">;

/** Sort menus by category order, then by their configured order within each category. */
export function sortMenuItemsByCategory<T extends OrderedMenuItem>(
  items: readonly T[],
  categories: readonly OrderedCategory[],
): T[] {
  const categoryOrder = new Map(
    categories.map((category, index) => [category.id, { sortOrder: category.sort_order, index }]),
  );

  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aCategory = categoryOrder.get(a.item.category_id ?? "");
      const bCategory = categoryOrder.get(b.item.category_id ?? "");
      if (aCategory && bCategory) {
        const categoryDifference = aCategory.sortOrder - bCategory.sortOrder || aCategory.index - bCategory.index;
        if (categoryDifference) return categoryDifference;
      } else if (aCategory) {
        return -1;
      } else if (bCategory) {
        return 1;
      }
      return (
        a.item.sort_order - b.item.sort_order ||
        a.item.name.localeCompare(b.item.name, "id") ||
        a.index - b.index
      );
    })
    .map(({ item }) => item);
}
