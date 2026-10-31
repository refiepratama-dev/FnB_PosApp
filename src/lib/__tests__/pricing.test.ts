import { describe, expect, it } from "vitest";
import { calcOrderTotals, itemUnitPrice, ojolUnitPrice, roundUpTo500 } from "../pricing";

const noTax = { tax_enabled: false, tax_percent: 10, service_enabled: false, service_percent: 5 };

describe("itemUnitPrice", () => {
  it("harga dasar + tambahan varian/topping", () => {
    expect(itemUnitPrice(18000)).toBe(18000);
    expect(
      itemUnitPrice(18000, [
        { group: "Ukuran", name: "Large", price_delta: 5000 },
        { group: "Topping", name: "Extra Shot", price_delta: 5000 },
      ]),
    ).toBe(28000);
  });
});

describe("harga ojol", () => {
  it("bulat ke atas kelipatan Rp500", () => {
    expect(roundUpTo500(16875)).toBe(17000);
    expect(roundUpTo500(17000)).toBe(17000);
    expect(roundUpTo500(17001)).toBe(17500);
  });
  it("contoh di dokumen: 13.500 + 25% = 17.000", () => {
    expect(ojolUnitPrice(13500, 25)).toBe(17000);
  });
  it("tidak salah karena pecahan desimal", () => {
    expect(ojolUnitPrice(13500, 10)).toBe(15000); // 14850 -> 15000
    expect(ojolUnitPrice(5000, 0)).toBe(5000);
  });
});

describe("calcOrderTotals (sama dengan create_order di database)", () => {
  it("tanpa diskon & pajak", () => {
    expect(calcOrderTotals([{ unitPrice: 5000, qty: 2 }], 0, noTax).total).toBe(10000);
  });
  it("contoh tes database: diskon 10% + pajak 10% -> 32.670", () => {
    const t = calcOrderTotals(
      [
        { unitPrice: 5000, qty: 2 },
        { unitPrice: 23000, qty: 1 },
      ],
      10,
      { ...noTax, tax_enabled: true },
    );
    expect(t).toEqual({ subtotal: 33000, discountAmount: 3300, serviceAmount: 0, taxAmount: 2970, total: 32670 });
  });
  it("urutan: diskon -> service -> pajak", () => {
    const t = calcOrderTotals([{ unitPrice: 100000, qty: 1 }], 10, {
      tax_enabled: true,
      tax_percent: 10,
      service_enabled: true,
      service_percent: 5,
    });
    // 100000 - 10000 = 90000; service 4500; pajak (94500 x 10%) = 9450
    expect(t).toEqual({ subtotal: 100000, discountAmount: 10000, serviceAmount: 4500, taxAmount: 9450, total: 103950 });
  });
  it("pembulatan 0,5 ke atas seperti PostgreSQL", () => {
    // 12345 x 10% = 1234.5 -> 1235
    expect(calcOrderTotals([{ unitPrice: 12345, qty: 1 }], 10, noTax).discountAmount).toBe(1235);
  });
});
