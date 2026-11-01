import { OJOL_PROVIDER_LABEL, ORDER_TYPE_LABEL, PAYMENT_METHOD_LABEL } from "@/constants/labels";
import { formatDateTime, formatRupiah } from "@/lib/format";
import type { Order, OrderItem, StoreSettings } from "@/types/database";
import { CMD, center, charsPerLine, divider, row, wrap, type PaperSize } from "./escpos";

/** Data toko yang tampil di kepala & kaki struk. */
export type ReceiptStore = Pick<StoreSettings, "name" | "address" | "phone" | "receipt_footer" | "paper_size">;

/** Kepala struk: nama toko (besar), alamat, no HP. */
function header(store: ReceiptStore, width: number): string[] {
  const out: string[] = [CMD.alignCenter];
  // huruf besar = lebar 2x, jadi muatnya setengah
  for (const line of wrap(store.name, Math.floor(width / 2))) {
    out.push(`${CMD.bigOn}${CMD.boldOn}${line}${CMD.boldOff}${CMD.sizeNormal}`);
  }
  if (store.address) out.push(...wrap(store.address, width));
  if (store.phone) out.push(...wrap(store.phone, width));
  out.push(CMD.alignLeft);
  return out;
}

function typeLine(order: Order): string {
  if (order.order_type === "dine_in") {
    return `${ORDER_TYPE_LABEL.dine_in}${order.table_number ? ` - Meja ${order.table_number}` : ""}`;
  }
  if (order.order_type === "ojol" && order.ojol_provider) {
    const ref = order.ojol_order_ref ? ` #${order.ojol_order_ref}` : "";
    return `${OJOL_PROVIDER_LABEL[order.ojol_provider]}${ref}`;
  }
  return ORDER_TYPE_LABEL[order.order_type];
}

/**
 * Struk 1 order, sesuai docs: 1 struk per order (dipakai pelanggan & dapur).
 * Hasilnya teks + perintah ESC/POS, tinggal dikirim ke printText().
 */
export function buildReceipt(order: Order, items: OrderItem[], store: ReceiptStore): string {
  const width = charsPerLine(store.paper_size);
  const out: string[] = [...header(store, width), divider(width)];

  out.push(...row(order.order_number, formatDateTime(order.created_at).replace(",", ""), width));
  out.push(`${CMD.boldOn}${typeLine(order)}${CMD.boldOff}`);
  const customer = order.member_name ?? order.customer_name;
  if (customer) out.push(...wrap(`Pelanggan: ${customer}`, width));
  out.push(divider(width));

  for (const item of items) {
    out.push(...row(`${item.qty}x ${item.name}`, formatRupiah(item.line_total), width));
    for (const option of item.options ?? []) {
      const price = option.price_delta ? ` +${formatRupiah(option.price_delta)}` : "";
      out.push(...wrap(`  - ${option.name}${price}`, width));
    }
    if (item.note) out.push(...wrap(`  Catatan: ${item.note}`, width));
  }
  out.push(divider(width));

  out.push(...row("Subtotal", formatRupiah(order.subtotal), width));
  if (order.discount_amount > 0) {
    out.push(...row(`Diskon ${Number(order.discount_percent)}%`, `-${formatRupiah(order.discount_amount)}`, width));
  }
  if (order.service_amount > 0) out.push(...row("Service", formatRupiah(order.service_amount), width));
  if (order.tax_amount > 0) out.push(...row("Pajak", formatRupiah(order.tax_amount), width));
  out.push(`${CMD.tallOn}${CMD.boldOn}${row("TOTAL", formatRupiah(order.total), width).join("\n")}${CMD.boldOff}${CMD.sizeNormal}`);
  out.push(...row("Bayar", PAYMENT_METHOD_LABEL[order.payment_method], width));

  if (order.status === "cancelled") {
    out.push("", CMD.alignCenter, `${CMD.boldOn}*** DIBATALKAN ***${CMD.boldOff}`, CMD.alignLeft);
  }

  out.push(divider(width));
  if (store.receipt_footer?.trim()) {
    out.push(CMD.alignCenter, ...wrap(store.receipt_footer, width), CMD.alignLeft);
  }
  return joinLines(out);
}

/** Halaman tes printer: cek lebar kertas, huruf tebal/besar, dan rata tengah. */
export function buildTestPage(store: Pick<ReceiptStore, "name">, paper: PaperSize, printerName: string): string {
  const width = charsPerLine(paper);
  const ruler = "1234567890".repeat(Math.ceil(width / 10)).slice(0, width);
  return joinLines([
    ...header({ name: store.name, address: null, phone: null, receipt_footer: "", paper_size: paper }, width),
    divider(width),
    ...center("TES PRINTER BERHASIL", width),
    divider(width),
    ...row("Printer", printerName, width),
    ...row("Kertas", `${paper} mm (${width} huruf)`, width),
    ...row("Waktu", formatDateTime(new Date()), width),
    "",
    "Penggaris (harus pas 1 baris):",
    ruler,
    "",
    `${CMD.boldOn}Huruf tebal${CMD.boldOff}`,
    `${CMD.tallOn}Huruf tinggi${CMD.sizeNormal}`,
    ...row("Kiri", "Kanan", width),
    divider(width, "="),
    CMD.alignCenter,
    "TemanPOS",
    CMD.alignLeft,
  ]);
}

/**
 * Gabung baris. Perintah murni (align) tidak boleh menambah baris kosong,
 * jadi ditempel ke awal baris berikutnya.
 */
const ALIGN_COMMANDS: string[] = [CMD.alignLeft, CMD.alignCenter, CMD.alignRight];

function joinLines(lines: string[]): string {
  let text = "";
  let pending = "";
  for (const line of lines) {
    if (ALIGN_COMMANDS.includes(line)) {
      pending += line;
      continue;
    }
    text += `${pending}${line}\n`;
    pending = "";
  }
  return text + pending;
}
