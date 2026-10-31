import { Pressable, ScrollView, TextInput, View, useWindowDimensions } from "react-native";
import { Minus, Percent, Plus, ShoppingBag, Trash2, UserRound, X } from "lucide-react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { colors } from "@/constants/colors";
import { OJOL_PROVIDER_LABEL, ORDER_TYPE_LABEL } from "@/constants/labels";
import { formatRupiah } from "@/lib/format";
import type { OrderTotals } from "@/lib/pricing";
import type { OjolProvider, OrderType } from "@/types/database";
import { useCart, type CartLine } from "./cartStore";

const TYPES: OrderType[] = ["dine_in", "takeaway", "ojol"];
const PROVIDERS: OjolProvider[] = ["gofood", "grabfood", "shopeefood"];

function Segment<T extends string>({
  items,
  value,
  label,
  onChange,
}: {
  items: T[];
  value: T;
  label: (v: T) => string;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row rounded-full bg-panel p-1">
      {items.map((item) => (
        <Pressable
          key={item}
          onPress={() => onChange(item)}
          className={`h-9 flex-1 items-center justify-center rounded-full ${value === item ? "bg-brand" : ""}`}
        >
          <AppText numberOfLines={1} className={`text-xs ${value === item ? "font-heading text-white" : "text-ink"}`}>
            {label(item)}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

function SmallInput({ value, onChangeText, placeholder, keyboardType }: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: "default" | "number-pad";
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.inkMuted}
      keyboardType={keyboardType}
      className="h-11 rounded-full border border-line bg-white px-4 font-sans text-sm text-ink focus:border-brand"
    />
  );
}

function CartRow({ line, unitPrice }: { line: CartLine; unitPrice: number }) {
  const changeQty = useCart((s) => s.changeQty);
  const atMax = line.trackStock && line.qty >= line.stockQty;

  return (
    <View className="border-b border-line py-3">
      <View className="flex-row items-start gap-2">
        <View className="flex-1">
          <AppText className="text-sm">{line.name}</AppText>
          {line.options.length ? (
            <AppText variant="muted" className="text-xs">
              {line.options.map((o) => o.name).join(", ")}
            </AppText>
          ) : null}
          {line.note ? (
            <AppText variant="muted" className="text-xs italic">
              “{line.note}”
            </AppText>
          ) : null}
        </View>
        <AppText variant="heading" className="text-sm">
          {formatRupiah(unitPrice * line.qty)}
        </AppText>
      </View>
      <View className="mt-2 flex-row items-center justify-between">
        <AppText variant="muted" className="text-xs">
          @ {formatRupiah(unitPrice)}
        </AppText>
        <View className="flex-row items-center rounded-full bg-panel">
          <Pressable onPress={() => changeQty(line.key, -1)} className="h-8 w-9 items-center justify-center">
            {line.qty === 1 ? <Trash2 size={15} color={colors.action} /> : <Minus size={16} color={colors.ink} />}
          </Pressable>
          <AppText variant="heading" className="w-6 text-center text-sm">
            {line.qty}
          </AppText>
          <Pressable
            onPress={() => changeQty(line.key, 1)}
            disabled={atMax}
            className={`h-8 w-9 items-center justify-center ${atMax ? "opacity-30" : ""}`}
          >
            <Plus size={16} color={colors.ink} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function TotalRow({ label, value, minus = false }: { label: string; value: number; minus?: boolean }) {
  return (
    <View className="flex-row justify-between">
      <AppText variant="muted" className="text-sm">
        {label}
      </AppText>
      <AppText className={`text-sm ${minus ? "text-action" : ""}`}>
        {minus ? "-" : ""}
        {formatRupiah(value)}
      </AppText>
    </View>
  );
}

/** Panel kanan halaman kasir: tipe order, data pelanggan, isi keranjang, total, tombol Bayar. */
export function OrderPanel({
  width,
  totals,
  unitPriceOf,
  onPickMember,
  onDiscount,
  onPay,
  taxLabel,
  serviceLabel,
}: {
  width: number;
  totals: OrderTotals;
  unitPriceOf: (line: CartLine) => number;
  onPickMember: () => void;
  onDiscount: () => void;
  onPay: () => void;
  taxLabel: string;
  serviceLabel: string;
}) {
  const { height } = useWindowDimensions();
  const compact = height < 520; // HP landscape: rincian total disembunyikan
  const cart = useCart();
  const itemCount = cart.lines.reduce((sum, l) => sum + l.qty, 0);

  const blocker =
    cart.lines.length === 0
      ? "Keranjang masih kosong"
      : cart.orderType === "dine_in" && !cart.tableNumber.trim()
        ? "Isi nomor meja dulu"
        : null;

  return (
    <View style={{ width }} className="border-l border-line bg-white">
      {/* Judul */}
      <View className="h-14 flex-row items-center justify-between border-b border-line px-4">
        <AppText variant="heading" className="text-base">
          Pesanan {itemCount ? `(${itemCount})` : ""}
        </AppText>
        {cart.lines.length ? (
          <Pressable onPress={cart.reset} className="flex-row items-center gap-1 rounded-full px-3 py-1.5 active:bg-panel">
            <Trash2 size={14} color={colors.action} />
            <AppText className="text-xs text-action">Kosongkan</AppText>
          </Pressable>
        ) : null}
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-3 p-4" keyboardShouldPersistTaps="handled">
        <Segment items={TYPES} value={cart.orderType} label={(t) => ORDER_TYPE_LABEL[t]} onChange={cart.setOrderType} />

        {cart.orderType === "dine_in" ? (
          <SmallInput
            value={cart.tableNumber}
            onChangeText={(t) => cart.setField("tableNumber", t)}
            placeholder="Nomor meja (wajib)"
            keyboardType="number-pad"
          />
        ) : null}

        {cart.orderType === "ojol" ? (
          <>
            <Segment
              items={PROVIDERS}
              value={cart.ojolProvider}
              label={(p) => OJOL_PROVIDER_LABEL[p]}
              onChange={cart.setOjolProvider}
            />
            <SmallInput value={cart.ojolRef} onChangeText={(t) => cart.setField("ojolRef", t)} placeholder="No. order ojol (opsional)" />
          </>
        ) : null}

        <SmallInput
          value={cart.customerName}
          onChangeText={(t) => cart.setField("customerName", t)}
          placeholder="Nama pelanggan (opsional)"
        />

        {cart.member ? (
          <View className="h-11 flex-row items-center gap-2 rounded-full bg-brand-soft pl-4 pr-1">
            <UserRound size={16} color={colors.brand} />
            <AppText numberOfLines={1} className="flex-1 font-heading text-sm text-brand">
              {cart.member.name}
            </AppText>
            <Pressable onPress={() => cart.setMember(null)} className="h-9 w-9 items-center justify-center rounded-full">
              <X size={16} color={colors.brand} />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={onPickMember} className="h-11 flex-row items-center gap-2 rounded-full border border-dashed border-line px-4 active:bg-panel">
            <UserRound size={16} color={colors.inkMuted} />
            <AppText variant="muted" className="text-sm">
              Pilih member (opsional)
            </AppText>
          </Pressable>
        )}

        <View>
          {cart.lines.length === 0 ? (
            <View className="items-center gap-2 py-8">
              <ShoppingBag size={28} color={colors.line} />
              <AppText variant="muted" className="text-center text-sm">
                Tap menu untuk menambahkan
              </AppText>
            </View>
          ) : (
            cart.lines.map((line) => <CartRow key={line.key} line={line} unitPrice={unitPriceOf(line)} />)
          )}
        </View>
      </ScrollView>

      {/* Total & tombol bayar */}
      <View className="gap-2 border-t border-line p-4">
        <Pressable onPress={onDiscount} className="flex-row items-center gap-2 self-start rounded-full bg-panel px-3 py-1.5 active:bg-line">
          <Percent size={14} color={cart.discountPercent ? colors.action : colors.ink} />
          <AppText className={`text-xs ${cart.discountPercent ? "font-heading text-action" : ""}`}>
            {cart.discountPercent ? `Diskon ${cart.discountPercent}%` : "Tambah diskon"}
          </AppText>
        </Pressable>

        {!compact ? (
          <>
            <TotalRow label="Subtotal" value={totals.subtotal} />
            {totals.discountAmount ? <TotalRow label={`Diskon ${cart.discountPercent}%`} value={totals.discountAmount} minus /> : null}
            {totals.serviceAmount ? <TotalRow label={serviceLabel} value={totals.serviceAmount} /> : null}
            {totals.taxAmount ? <TotalRow label={taxLabel} value={totals.taxAmount} /> : null}
          </>
        ) : null}

        <View className="flex-row items-end justify-between">
          <AppText variant="heading" className="text-base">
            Total
          </AppText>
          <AppText variant="heading" className="text-2xl">
            {formatRupiah(totals.total)}
          </AppText>
        </View>

        <Button
          title={blocker ?? (cart.orderType === "ojol" ? "Simpan Order" : "Bayar")}
          variant="action"
          disabled={!!blocker}
          onPress={onPay}
        />
      </View>
    </View>
  );
}
