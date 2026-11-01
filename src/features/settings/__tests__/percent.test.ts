import { describe, expect, it } from "vitest";
import { parsePercent, percentText, sanitizePercentInput } from "../percent";

describe("parsePercent", () => {
  it("menerima angka 0-100, koma atau titik", () => {
    expect(parsePercent("0")).toBe(0);
    expect(parsePercent("10")).toBe(10);
    expect(parsePercent("7,5")).toBe(7.5);
    expect(parsePercent("7.25")).toBe(7.25);
    expect(parsePercent(" 100 ")).toBe(100);
    expect(parsePercent("10.")).toBe(10);
  });
  it("menolak kosong, negatif, lebih dari 100, dan format aneh", () => {
    expect(parsePercent("")).toBeNull();
    expect(parsePercent("abc")).toBeNull();
    expect(parsePercent("-5")).toBeNull();
    expect(parsePercent("100,5")).toBeNull();
    expect(parsePercent("101")).toBeNull();
    expect(parsePercent("1,2,3")).toBeNull();
    expect(parsePercent("7,255")).toBeNull();
  });
});

describe("percentText & sanitizePercentInput", () => {
  it("memformat dan membersihkan input", () => {
    expect(percentText(10)).toBe("10");
    expect(percentText(7.5)).toBe("7,5");
    expect(sanitizePercentInput("1a0%,5")).toBe("10,5");
  });
});
