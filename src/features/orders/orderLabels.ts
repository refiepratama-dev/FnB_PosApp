import { OJOL_PROVIDER_LABEL, ORDER_TYPE_LABEL } from "@/constants/labels";
import type { Order } from "@/types/database";

/** "Dine-in • Meja 5" / "Takeaway" / "GoFood" */
export function orderTypeText(order: Pick<Order, "order_type" | "ojol_provider" | "table_number">) {
  if (order.order_type === "ojol" && order.ojol_provider) return OJOL_PROVIDER_LABEL[order.ojol_provider];
  if (order.order_type === "dine_in" && order.table_number) return `Dine-in • Meja ${order.table_number}`;
  return ORDER_TYPE_LABEL[order.order_type];
}
