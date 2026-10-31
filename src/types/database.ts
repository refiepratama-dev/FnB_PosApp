/**
 * Bentuk data tiap tabel di database (lihat supabase/migrations/).
 * Kalau ada kolom baru di database, tambahkan juga di sini.
 */

export type OrderType = "dine_in" | "takeaway" | "ojol";
export type OjolProvider = "gofood" | "grabfood" | "shopeefood";
export type PaymentMethod = "cash" | "qris" | "transfer" | "debit" | "ojol";
export type OjolCashSource = "driver_cash" | "merchant_balance";
export type OrderStatus = "paid" | "cancelled";

export type StoreSettings = {
  id: 1;
  name: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  tax_enabled: boolean;
  tax_percent: number;
  service_enabled: boolean;
  service_percent: number;
  ojol_markup: Record<OjolProvider, number>;
  receipt_footer: string;
  paper_size: "58" | "80";
  timezone: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
};

export type MenuItem = {
  id: string;
  category_id: string | null;
  name: string;
  price: number;
  cost_price: number | null;
  image_url: string | null;
  track_stock: boolean;
  stock_qty: number;
  is_archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type OptionGroup = {
  id: string;
  menu_item_id: string;
  name: string;
  type: "variant" | "addon";
  is_required: boolean;
  max_select: number;
  sort_order: number;
};

export type Option = {
  id: string;
  group_id: string;
  name: string;
  price_delta: number;
  sort_order: number;
};

/** Menu lengkap dengan grup pilihan & pilihannya (hasil query bertingkat). */
export type MenuItemWithOptions = MenuItem & {
  option_groups: (OptionGroup & { options: Option[] })[];
};

export type Member = {
  id: string;
  name: string;
  phone: string;
  created_at: string;
};

export type Order = {
  id: string;
  order_number: string;
  business_date: string;
  daily_seq: number;
  order_type: OrderType;
  ojol_provider: OjolProvider | null;
  ojol_order_ref: string | null;
  table_number: string | null;
  customer_name: string | null;
  member_id: string | null;
  member_name: string | null;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  service_amount: number;
  tax_amount: number;
  total: number;
  payment_method: PaymentMethod;
  ojol_cash_source: OjolCashSource | null;
  status: OrderStatus;
  cancel_reason: string | null;
  cancelled_at: string | null;
  created_by_mode: "owner" | "cashier";
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  unit_price: number;
  cost_price: number;
  qty: number;
  note: string | null;
  options: { group: string; name: string; price_delta: number }[];
  line_total: number;
};

export type OrderWithItems = Order & { order_items: OrderItem[] };

export type Expense = {
  id: string;
  description: string;
  amount: number;
  method: "cash" | "transfer";
  receipt_image_url: string | null;
  expense_date: string;
  created_at: string;
  updated_at: string;
};

export type StockMovement = {
  id: string;
  menu_item_id: string;
  type: "add" | "adjust" | "sale" | "cancel";
  qty_change: number;
  qty_after: number;
  note: string | null;
  order_id: string | null;
  created_at: string;
};
