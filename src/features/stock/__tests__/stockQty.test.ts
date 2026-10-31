import { describe, expect, it } from "vitest";
import { MAX_STOCK, parseQty, qtyError, stockAfter } from "../stockQty";

describe("stockQty", () => {
  it("parseQty", () => {
    expect(parseQty("12")).toBe(12);
    expect(parseQty("1.000")).toBe(1000);
    expect(parseQty("")).toBeNull();
    expect(parseQty("abc")).toBeNull();
  });

  it("qtyError", () => {
    expect(qtyError(null, "add")).toMatch(/Isi jumlah/);
    expect(qtyError(0, "add")).toMatch(/lebih dari 0/);
    expect(qtyError(0, "adjust")).toBeNull(); // boleh set stok jadi 0 (habis)
    expect(qtyError(5, "add")).toBeNull();
    expect(qtyError(MAX_STOCK + 1, "adjust")).toMatch(/terlalu besar/);
  });

  it("stockAfter", () => {
    expect(stockAfter(8, 5, "add")).toBe(13);
    expect(stockAfter(8, 5, "adjust")).toBe(5);
  });
});
