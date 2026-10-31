import { formatDate, formatMonth, toISODate } from "./format";

/**
 * Filter periode untuk Laporan, Pengeluaran, dan Order:
 * tab Hari Ini / Tanggal / Minggu / Bulan + tombol ‹ ›
 */
export type PeriodType = "today" | "date" | "week" | "month";

export type Period = {
  type: PeriodType;
  /** Tanggal acuan (hari yang dipilih / hari di dalam minggu / bulan) */
  anchor: Date;
};

export type DateRange = {
  /** Tanggal awal (inklusif), format YYYY-MM-DD */
  from: string;
  /** Tanggal akhir (inklusif), format YYYY-MM-DD */
  to: string;
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

/** Minggu dimulai hari Senin */
function startOfWeek(d: Date) {
  const day = d.getDay(); // 0 = Minggu
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(startOfDay(d), diff);
}

export function todayPeriod(): Period {
  return { type: "today", anchor: startOfDay(new Date()) };
}

/** Rentang tanggal untuk query database: .gte("business_date", from).lte("business_date", to) */
export function periodRange(p: Period): DateRange {
  const a = startOfDay(p.anchor);
  if (p.type === "week") {
    const start = startOfWeek(a);
    return { from: toISODate(start), to: toISODate(addDays(start, 6)) };
  }
  if (p.type === "month") {
    const start = new Date(a.getFullYear(), a.getMonth(), 1);
    const end = new Date(a.getFullYear(), a.getMonth() + 1, 0);
    return { from: toISODate(start), to: toISODate(end) };
  }
  return { from: toISODate(a), to: toISODate(a) };
}

/** Geser periode: step = -1 (‹ sebelumnya) atau +1 (› berikutnya) */
export function shiftPeriod(p: Period, step: -1 | 1): Period {
  const a = startOfDay(p.anchor);
  if (p.type === "week") return { type: "week", anchor: addDays(a, step * 7) };
  if (p.type === "month") return { type: "month", anchor: new Date(a.getFullYear(), a.getMonth() + step, 1) };
  // Hari Ini yang digeser jadi mode Tanggal
  return { type: "date", anchor: addDays(a, step) };
}

/** Periode berikutnya sudah melewati hari ini? (untuk menonaktifkan tombol ›) */
export function isFuturePeriod(p: Period, now = new Date()): boolean {
  return periodRange(p).from > toISODate(now);
}

/** Label di tengah, di antara tombol ‹ › */
export function periodLabel(p: Period, now = new Date()): string {
  const a = startOfDay(p.anchor);
  if (p.type === "month") return formatMonth(a);
  if (p.type === "week") {
    const start = startOfWeek(a);
    return `${formatDate(start)} – ${formatDate(addDays(start, 6))}`;
  }
  const iso = toISODate(a);
  if (iso === toISODate(now)) return `Hari Ini, ${formatDate(a)}`;
  if (iso === toISODate(addDays(startOfDay(now), -1))) return `Kemarin, ${formatDate(a)}`;
  return formatDate(a);
}
