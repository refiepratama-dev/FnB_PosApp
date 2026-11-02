-- =====================================================================
-- Revisi: nomor meja dine-in jadi OPSIONAL (sama seperti nama pelanggan & member).
-- 1. Hapus aturan "dine-in wajib isi nomor meja" di tabel orders.
-- 2. Ganti fungsi create_order: tanpa cek nomor meja (isi lainnya sama persis).
-- Aman dijalankan ulang.
-- =====================================================================

do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%table_number%'
  loop
    execute format('alter table public.orders drop constraint %I', c.conname);
  end loop;
end $$;

create or replace function public.create_order(p_order jsonb, p_items jsonb)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  s           public.store_settings;
  v_today     date;
  v_seq       int;
  v_subtotal  int := 0;
  v_disc_pct  numeric;
  v_discount  int;
  v_service   int := 0;
  v_tax       int := 0;
  v_order     public.orders;
  v_item      jsonb;
  v_menu      public.menu_items;
  v_qty       int;
  v_member    public.members;
begin
  if auth.uid() is null then
    raise exception 'Harus login';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang masih kosong';
  end if;

  if p_order ->> 'order_type' = 'ojol' and (
       coalesce(p_order ->> 'ojol_provider', '') = '' or coalesce(p_order ->> 'ojol_cash_source', '') = '') then
    raise exception 'Pilih provider ojol dan sumber uangnya';
  end if;

  select * into s from public.store_settings where id = 1;
  v_today := (now() at time zone s.timezone)::date;

  -- Nomor order harian: kunci per tanggal supaya 2 kasir tidak dapat nomor yang sama
  perform pg_advisory_xact_lock(hashtext('order_seq_' || v_today::text));
  select coalesce(max(daily_seq), 0) + 1 into v_seq from public.orders where business_date = v_today;

  -- Hitung subtotal dari item
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'qty')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Jumlah item tidak valid';
    end if;
    v_subtotal := v_subtotal + (v_item ->> 'unit_price')::int * v_qty;
  end loop;

  v_disc_pct := coalesce((p_order ->> 'discount_percent')::numeric, 0);
  v_discount := round(v_subtotal * v_disc_pct / 100);
  if s.service_enabled then
    v_service := round((v_subtotal - v_discount) * s.service_percent / 100);
  end if;
  if s.tax_enabled then
    v_tax := round((v_subtotal - v_discount + v_service) * s.tax_percent / 100);
  end if;

  if p_order ->> 'member_id' is not null then
    select * into v_member from public.members where id = (p_order ->> 'member_id')::uuid;
  end if;

  insert into public.orders (
    order_number, business_date, daily_seq, order_type, ojol_provider, ojol_order_ref,
    table_number, customer_name, member_id, member_name,
    subtotal, discount_percent, discount_amount, service_amount, tax_amount, total,
    payment_method, ojol_cash_source, created_by_mode
  ) values (
    'TP-' || to_char(v_today, 'YYMMDD') || '-' || lpad(v_seq::text, 3, '0'),
    v_today, v_seq,
    p_order ->> 'order_type',
    nullif(p_order ->> 'ojol_provider', ''),
    nullif(trim(p_order ->> 'ojol_order_ref'), ''),
    nullif(trim(p_order ->> 'table_number'), ''),
    nullif(trim(p_order ->> 'customer_name'), ''),
    v_member.id, v_member.name,
    v_subtotal, v_disc_pct, v_discount, v_service, v_tax,
    v_subtotal - v_discount + v_service + v_tax,
    p_order ->> 'payment_method',
    nullif(p_order ->> 'ojol_cash_source', ''),
    coalesce(p_order ->> 'created_by_mode', 'cashier')
  ) returning * into v_order;

  -- Simpan item + potong stok
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'qty')::int;

    select * into v_menu from public.menu_items where id = (v_item ->> 'menu_item_id')::uuid for update;
    if not found then
      raise exception 'Menu tidak ditemukan';
    end if;

    if v_menu.track_stock then
      if v_menu.stock_qty < v_qty then
        raise exception 'Stok % tidak cukup (sisa %)', v_menu.name, v_menu.stock_qty;
      end if;
      update public.menu_items set stock_qty = stock_qty - v_qty where id = v_menu.id;
      insert into public.stock_movements (menu_item_id, type, qty_change, qty_after, order_id)
      values (v_menu.id, 'sale', -v_qty, v_menu.stock_qty - v_qty, v_order.id);
    end if;

    insert into public.order_items (order_id, menu_item_id, name, unit_price, cost_price, qty, note, options)
    values (
      v_order.id, v_menu.id, v_menu.name,
      (v_item ->> 'unit_price')::int,
      coalesce(v_menu.cost_price, 0),
      v_qty,
      nullif(trim(v_item ->> 'note'), ''),
      coalesce(v_item -> 'options', '[]'::jsonb)
    );
  end loop;

  return v_order;
end;
$$;
