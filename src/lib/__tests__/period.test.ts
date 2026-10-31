import { describe, expect, it } from "vitest";
import { isFuturePeriod, periodLabel, periodRange, shiftPeriod } from "../period";

const sat = new Date(2026, 9, 31); // Sabtu 31 Okt 2026

describe("periodRange", () => {
  it("hari", () => {
    expect(periodRange({ type: "today", anchor: sat })).toEqual({ from: "2026-10-31", to: "2026-10-31" });
  });
  it("minggu dimulai Senin", () => {
    expect(periodRange({ type: "week", anchor: sat })).toEqual({ from: "2026-10-26", to: "2026-11-01" });
  });
  it("bulan", () => {
    expect(periodRange({ type: "month", anchor: sat })).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(periodRange({ type: "month", anchor: new Date(2028, 1, 10) })).toEqual({ from: "2028-02-01", to: "2028-02-29" });
  });
});

describe("shiftPeriod", () => {
  it("‹ dari Hari Ini jadi mode Tanggal kemarin", () => {
    const p = shiftPeriod({ type: "today", anchor: sat }, -1);
    expect(p.type).toBe("date");
    expect(periodRange(p).from).toBe("2026-10-30");
  });
  it("geser minggu & bulan", () => {
    expect(periodRange(shiftPeriod({ type: "week", anchor: sat }, -1)).from).toBe("2026-10-19");
    expect(periodRange(shiftPeriod({ type: "month", anchor: new Date(2026, 0, 31) }, 1))).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
  });
});

describe("label & masa depan", () => {
  it("label", () => {
    expect(periodLabel({ type: "today", anchor: sat }, sat)).toBe("Hari Ini, 31 Okt 2026");
    expect(periodLabel({ type: "date", anchor: new Date(2026, 9, 30) }, sat)).toBe("Kemarin, 30 Okt 2026");
    expect(periodLabel({ type: "month", anchor: sat }, sat)).toBe("Oktober 2026");
    expect(periodLabel({ type: "week", anchor: sat }, sat)).toBe("26 Okt 2026 – 1 Nov 2026");
  });
  it("tombol › nonaktif kalau periode berikutnya di masa depan", () => {
    expect(isFuturePeriod(shiftPeriod({ type: "today", anchor: sat }, 1), sat)).toBe(true);
    expect(isFuturePeriod(shiftPeriod({ type: "date", anchor: new Date(2026, 9, 29) }, 1), sat)).toBe(false);
  });
});
