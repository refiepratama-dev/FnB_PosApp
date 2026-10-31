import { describe, expect, it } from "vitest";
import { formatDate, formatRupiah, formatTime } from "../format";

describe("format", () => {
  it("rupiah", () => {
    expect(formatRupiah(15000)).toBe("Rp15.000");
    expect(formatRupiah(1250000)).toBe("Rp1.250.000");
    expect(formatRupiah(0)).toBe("Rp0");
    expect(formatRupiah(-5000)).toBe("-Rp5.000");
  });
  it("tanggal & jam", () => {
    const d = new Date(2026, 9, 31, 14, 5);
    expect(formatDate(d)).toBe("31 Okt 2026");
    expect(formatTime(d)).toBe("14:05");
  });
});
