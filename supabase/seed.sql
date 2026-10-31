-- =====================================================================
-- Data contoh untuk DEVELOPMENT saja (jangan dijalankan di toko asli).
-- Jalankan SETELAH migration init.
-- =====================================================================

update public.store_settings
   set name = 'Di`Sako Steak',
       address = 'Palembang',
       ojol_markup = '{"gofood": 20, "grabfood": 25, "shopeefood": 20}'
 where id = 1;

with c as (
  insert into public.categories (name, sort_order) values
    ('Steak', 1), ('Makanan', 2), ('Minuman', 3), ('Snack', 4)
  returning id, name
)
insert into public.menu_items (category_id, name, price, cost_price, track_stock, stock_qty, sort_order)
select c.id, m.name, m.price, m.cost, m.track, m.stock, m.ord
  from (values
    ('Steak',   'Sirloin Steak',     65000, 38000, false, 0,  1),
    ('Steak',   'Tenderloin Steak',  75000, 45000, false, 0,  2),
    ('Steak',   'Chicken Steak',     35000, 18000, false, 0,  3),
    ('Steak',   'Fish Steak',        38000, 20000, false, 0,  4),
    ('Makanan', 'Spaghetti Bolognese', 30000, 14000, false, 0, 1),
    ('Makanan', 'Nasi Goreng Sako',  25000, 11000, false, 0,  2),
    ('Minuman', 'Es Teh Manis',       6000,  1500, false, 0,  1),
    ('Minuman', 'Kopi Susu',         18000,  7000, false, 0,  2),
    ('Minuman', 'Jus Alpukat',       15000,  6000, false, 0,  3),
    ('Minuman', 'Air Mineral',        5000,  2500, true,  24, 4),
    ('Snack',   'Kentang Goreng',    15000,  6000, false, 0,  1),
    ('Snack',   'Puding Coklat',     12000,  5000, true,  8,  2)
  ) as m(cat, name, price, cost, track, stock, ord)
  join c on c.name = m.cat;

-- Varian saus + kematangan untuk semua steak daging
do $$
declare
  r record;
  g uuid;
begin
  for r in select mi.id, mi.name from public.menu_items mi
            join public.categories c on c.id = mi.category_id where c.name = 'Steak' loop
    insert into public.option_groups (menu_item_id, name, type, is_required, max_select, sort_order)
    values (r.id, 'Saus', 'variant', true, 1, 1) returning id into g;
    insert into public.options (group_id, name, price_delta, sort_order) values
      (g, 'Blackpepper', 0, 1), (g, 'Mushroom', 0, 2), (g, 'BBQ', 0, 3);

    if r.name in ('Sirloin Steak', 'Tenderloin Steak') then
      insert into public.option_groups (menu_item_id, name, type, is_required, max_select, sort_order)
      values (r.id, 'Kematangan', 'variant', true, 1, 2) returning id into g;
      insert into public.options (group_id, name, price_delta, sort_order) values
        (g, 'Medium Rare', 0, 1), (g, 'Medium', 0, 2), (g, 'Well Done', 0, 3);
    end if;

    insert into public.option_groups (menu_item_id, name, type, is_required, max_select, sort_order)
    values (r.id, 'Tambahan', 'addon', false, 3, 3) returning id into g;
    insert into public.options (group_id, name, price_delta, sort_order) values
      (g, 'Extra Saus', 5000, 1), (g, 'Telur Mata Sapi', 5000, 2), (g, 'Kentang Extra', 8000, 3);
  end loop;
end $$;

-- Varian & topping Kopi Susu
do $$
declare
  k uuid;
  g uuid;
begin
  select id into k from public.menu_items where name = 'Kopi Susu';

  insert into public.option_groups (menu_item_id, name, type, is_required, max_select, sort_order)
  values (k, 'Ukuran', 'variant', true, 1, 1) returning id into g;
  insert into public.options (group_id, name, price_delta, sort_order) values
    (g, 'Regular', 0, 1), (g, 'Large', 5000, 2);

  insert into public.option_groups (menu_item_id, name, type, is_required, max_select, sort_order)
  values (k, 'Suhu', 'variant', true, 1, 2) returning id into g;
  insert into public.options (group_id, name, price_delta, sort_order) values
    (g, 'Dingin', 0, 1), (g, 'Panas', 0, 2);

  insert into public.option_groups (menu_item_id, name, type, is_required, max_select, sort_order)
  values (k, 'Topping', 'addon', false, 2, 3) returning id into g;
  insert into public.options (group_id, name, price_delta, sort_order) values
    (g, 'Extra Shot', 5000, 1), (g, 'Less Sugar', 0, 2);
end $$;

insert into public.members (name, phone) values
  ('Budi Santoso', '081234567890'),
  ('Siti Aminah',  '085678901234');

insert into public.expenses (description, amount, method) values
  ('Beli es batu', 20000, 'cash'),
  ('Gas LPG', 25000, 'cash');
