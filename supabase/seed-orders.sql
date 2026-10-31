-- =====================================================================
-- Data dummy ORDER 30 hari terakhir, untuk mengembangkan Laporan & Dashboard.
-- DEVELOPMENT SAJA. Jalankan setelah seed.sql. Boleh dijalankan ulang
-- (order dummy lama dihapus dulu). Stok tidak diubah.
-- =====================================================================

delete from public.orders where order_number like 'TP-%' and created_by_mode = 'cashier' and customer_name = 'Dummy';

do $$
declare
  d          date;
  n          int;
  i          int;
  k          int;
  v_seq      int;
  v_type     text;
  v_provider text;
  v_pay      text;
  v_markup   numeric;
  v_hour     int;
  v_at       timestamptz;
  v_sub      int;
  v_disc_pct numeric;
  v_disc     int;
  v_order    uuid;
  v_item     record;
  v_qty      int;
  v_price    int;
  v_status   text;
begin
  for d in select generate_series(current_date - 29, current_date, interval '1 day')::date loop
    -- akhir pekan lebih ramai
    n := case when extract(isodow from d) in (6, 7) then 18 + floor(random() * 10) else 8 + floor(random() * 8) end;
    if d = current_date then n := 5; end if;

    select coalesce(max(daily_seq), 0) into v_seq from public.orders where business_date = d;

    for i in 1..n loop
      v_seq := v_seq + 1;
      v_type := (array['dine_in', 'dine_in', 'takeaway', 'takeaway', 'ojol'])[1 + floor(random() * 5)];
      v_provider := null;
      v_markup := 0;
      if v_type = 'ojol' then
        v_provider := (array['gofood', 'grabfood', 'shopeefood'])[1 + floor(random() * 3)];
        v_markup := (select (ojol_markup ->> v_provider)::numeric from public.store_settings where id = 1);
        v_pay := 'ojol';
      else
        v_pay := (array['cash', 'cash', 'qris', 'qris', 'transfer', 'debit'])[1 + floor(random() * 6)];
      end if;

      -- jam ramai: makan siang & makan malam
      v_hour := (array[11, 12, 12, 13, 13, 14, 17, 18, 18, 19, 19, 20, 21])[1 + floor(random() * 13)];
      v_at := (d + make_time(v_hour, floor(random() * 60)::int, 0)) at time zone 'Asia/Jakarta';
      v_disc_pct := case when random() < 0.15 then 10 else 0 end;
      v_status := case when random() < 0.04 then 'cancelled' else 'paid' end;

      insert into public.orders (
        order_number, business_date, daily_seq, order_type, ojol_provider, table_number, customer_name,
        subtotal, discount_percent, total, payment_method, ojol_cash_source, status, cancel_reason, cancelled_at, created_at
      ) values (
        'TP-' || to_char(d, 'YYMMDD') || '-' || lpad(v_seq::text, 3, '0'), d, v_seq, v_type, v_provider,
        case when v_type = 'dine_in' then (1 + floor(random() * 12))::text end, 'Dummy',
        0, v_disc_pct, 0, v_pay,
        case when v_type = 'ojol' then (array['driver_cash', 'merchant_balance'])[1 + floor(random() * 2)] end,
        v_status, case when v_status = 'cancelled' then 'salah input' end,
        case when v_status = 'cancelled' then v_at end, v_at
      ) returning id into v_order;

      v_sub := 0;
      for k in 1..(1 + floor(random() * 3))::int loop
        select id, name, price, coalesce(cost_price, 0) as cost into v_item
          from public.menu_items where not is_archived order by random() limit 1;
        v_qty := 1 + floor(random() * 2);
        v_price := case when v_type = 'ojol' then ceil(v_item.price * (100 + v_markup) / 100 / 500.0) * 500 else v_item.price end;
        insert into public.order_items (order_id, menu_item_id, name, unit_price, cost_price, qty)
        values (v_order, v_item.id, v_item.name, v_price, v_item.cost, v_qty);
        v_sub := v_sub + v_price * v_qty;
      end loop;

      v_disc := round(v_sub * v_disc_pct / 100);
      update public.orders set subtotal = v_sub, discount_amount = v_disc, total = v_sub - v_disc where id = v_order;
    end loop;
  end loop;
end $$;

select count(*) as jumlah_order, sum(total) filter (where status = 'paid') as omzet from public.orders where customer_name = 'Dummy';
