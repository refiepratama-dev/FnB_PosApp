import { describe, expect, it } from "vitest";
import { isValidPhone, normalizePhone, phoneError } from "../phone";

describe("phone", () => {
  it("merapikan ketikan", () => {
    expect(normalizePhone("+62 812-3456-7890")).toBe("6281234567890");
    expect(normalizePhone(" 0812 3456 7890 ")).toBe("081234567890");
  });

  it("valid: diawali 08 / 62, 10-14 digit", () => {
    expect(isValidPhone("081234567890")).toBe(true);
    expect(isValidPhone("6281234567890")).toBe(true);
    expect(isValidPhone("0812345678")).toBe(true); // 10 digit
    expect(isValidPhone("08123456789012")).toBe(true); // 14 digit
  });

  it("tidak valid", () => {
    expect(isValidPhone("08123456")).toBe(false); // terlalu pendek
    expect(isValidPhone("081234567890123")).toBe(false); // 15 digit
    expect(isValidPhone("81234567890")).toBe(false);
    expect(isValidPhone("071234567890")).toBe(false);
  });

  it("phoneError", () => {
    expect(phoneError("")).toMatch(/wajib/);
    expect(phoneError("71234567890")).toMatch(/diawali/);
    expect(phoneError("0812")).toMatch(/10–14/);
    expect(phoneError("0812-3456-7890")).toBeNull();
  });
});
