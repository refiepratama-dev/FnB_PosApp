import { describe, expect, it } from "vitest";
import { MAX_EXPENSE, amountError, digitsOnly, groupThousands, parseAmount } from "../amount";

describe("digitsOnly", () => {
  it("membuang selain angka dan nol di depan", () => {
    expect(digitsOnly("Rp 15.000")).toBe("15000");
    expect(digitsOnly("0015")).toBe("15");
    expect(digitsOnly("abc")).toBe("");
    expect(digitsOnly("0")).toBe("0");
  });
});

describe("groupThousands", () => {
  it("memberi titik ribuan", () => {
    expect(groupThousands("0")).toBe("0");
    expect(groupThousands("999")).toBe("999");
    expect(groupThousands("1000")).toBe("1.000");
    expect(groupThousands("1250000")).toBe("1.250.000");
  });
});

describe("parseAmount", () => {
  it("mengubah teks jadi angka", () => {
    expect(parseAmount("15.000")).toBe(15000);
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("   ")).toBeNull();
  });
});

describe("amountError", () => {
  it("menolak kosong, nol, dan terlalu besar", () => {
    expect(amountError("")).not.toBeNull();
    expect(amountError("0")).not.toBeNull();
    expect(amountError(String(MAX_EXPENSE + 1))).not.toBeNull();
  });
  it("menerima nominal wajar", () => {
    expect(amountError("1")).toBeNull();
    expect(amountError("15.000")).toBeNull();
    expect(amountError(String(MAX_EXPENSE))).toBeNull();
  });
});
