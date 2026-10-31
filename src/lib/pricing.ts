/**
 * Hitung harga. HARUS sama dengan fungsi create_order di database
 * (supabase/migrations/..._init.sql) dan docs/05-BUSINESS-RULES-DATA.md bagian A.
 * Kalau rumus diubah di sini, ubah juga di database (dan sebaliknya).
 */

export type OjolProvider = "gofood" | "grabfood" | "shopeefood";

export type SelectedOption = { group: string; name: string; price_delta: number };

/** Harga 1 porsi = harga dasar + semua tambahan harga varian/topping. */
export function itemUnitPrice(basePrice: number, options: SelectedOption[] = []): number {
  return basePrice + options.reduce((sum, o) => sum + o.price_delta, 0);
}

/** Bulatkan ke atas ke kelipatan Rp500. 16875 -> 17000, 17000 -> 17000 */
export function roundUpTo500(value: number): number {
  return Math.ceil(value / 500) * 500;
}

/**
 * Harga ojol 1 porsi = harga normal x (1 + persen provider), dibulatkan ke atas Rp500.
 * Contoh: ojolUnitPrice(13500, 25) -> 17000
 */
export function ojolUnitPrice(normalUnitPrice: number, markupPercent: number): number {
  // toFixed menghindari error pecahan desimal, misal 13500 * 1.1 = 14850.000000000002
  const raw = Number(((normalUnitPrice * (100 + markupPercent)) / 100).toFixed(2));
  return roundUpTo500(raw);
}

/** Pembulatan rupiah yang sama dengan round() di PostgreSQL (0.5 dibulatkan menjauhi nol). */
function roundRupiah(value: number): number {
  const fixed = Number(value.toFixed(6));
  return Math.sign(fixed) * Math.round(Math.abs(fixed));
}

export type TaxSettings = {
  tax_enabled: boolean;
  tax_percent: number;
  service_enabled: boolean;
  service_percent: number;
};

export type OrderTotals = {
  subtotal: number;
  discountAmount: number;
  serviceAmount: number;
  taxAmount: number;
  total: number;
};

/**
 * Urutan: subtotal -> diskon -> service -> pajak.
 * lines = [{ unitPrice, qty }]
 */
export function calcOrderTotals(
  lines: { unitPrice: number; qty: number }[],
  discountPercent: number,
  settings: TaxSettings,
): OrderTotals {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const discountAmount = roundRupiah((subtotal * discountPercent) / 100);
  const afterDiscount = subtotal - discountAmount;
  const serviceAmount = settings.service_enabled ? roundRupiah((afterDiscount * settings.service_percent) / 100) : 0;
  const taxAmount = settings.tax_enabled
    ? roundRupiah(((afterDiscount + serviceAmount) * settings.tax_percent) / 100)
    : 0;
  return {
    subtotal,
    discountAmount,
    serviceAmount,
    taxAmount,
    total: afterDiscount + serviceAmount + taxAmount,
  };
}
