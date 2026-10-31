import type { OjolCashSource, OjolProvider, OrderType, PaymentMethod } from "@/types/database";

/** Teks yang tampil di layar untuk nilai-nilai di database. */
export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  dine_in: "Dine-in",
  takeaway: "Takeaway",
  ojol: "Ojol",
};

export const OJOL_PROVIDER_LABEL: Record<OjolProvider, string> = {
  gofood: "GoFood",
  grabfood: "GrabFood",
  shopeefood: "ShopeeFood",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Tunai",
  qris: "QRIS",
  transfer: "Transfer",
  debit: "Debit/Kartu",
  ojol: "Ojol",
};

export const OJOL_CASH_SOURCE_LABEL: Record<OjolCashSource, string> = {
  driver_cash: "Tunai dari driver",
  merchant_balance: "Saldo merchant",
};
