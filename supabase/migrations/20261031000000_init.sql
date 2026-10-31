-- =====================================================================
-- TemanPOS: struktur database awal
-- Jalankan sekali di project Supabase baru (SQL Editor -> paste -> Run).
-- Lihat docs/05-BUSINESS-RULES-DATA.md untuk aturan bisnisnya.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Helper: kolom updated_at otomatis
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Pengaturan toko (selalu 1 baris, id = 1)
-- ---------------------------------------------------------------------
create table public.store_settings (
  id              int primary key default 1 check (id = 1),
  name            text not null default 'Nama Toko',
  address         text,
  phone           text,
  logo_url        text,
  tax_enabled     boolean not null default false,
  tax_percent     numeric(5,2) not null default 10 check (tax_percent between 0 and 100),
  service_enabled boolean not null default false,
  service_percent numeric(5,2) not null default 5 check (service_percent between 0 and 100),
  -- persen kenaikan harga ojol per provider
  ojol_markup     jsonb not null default '{"gofood": 20, "grabfood": 20, "shopeefood": 20}',
  receipt_footer  text not null default 'Terima kasih!',
  paper_size      text not null default '58' check (paper_size in ('58', '80')),
  timezone        text not null default 'Asia/Jakarta',
  updated_at      timestamptz not null default now()
);

insert into public.store_settings (id) values (1);

create trigger store_settings_updated_at before update on public.store_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- PIN owner (hash). Tabel ini TIDAK bisa dibaca dari app,
-- hanya lewat fungsi verify_owner_pin / change_owner_pin / reset_owner_pin.
-- ---------------------------------------------------------------------
create table public.owner_pin (
  id         int primary key default 1 check (id = 1),
  pin_hash   text not null,
  updated_at timestamptz not null default now()
);

-- PIN awal: 0000
insert into public.owner_pin (id, pin_hash) values (1, extensions.crypt('0000', extensions.gen_salt('bf')));

-- ---------------------------------------------------------------------
-- Menu
-- ---------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  sort_order  int not null default 0,
  is_archived boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid references public.categories(id) on delete set null,
  name         text not null check (length(trim(name)) > 0),
  price        int not null check (price > 0),
  cost_price   int check (cost_price >= 0),          -- HPP (opsional)
  image_url    text,
  track_stock  boolean not null default false,       -- true = masuk halaman Stok
  stock_qty    int not null default 0 check (stock_qty >= 0),
  is_archived  boolean not null default false,       -- "dihapus" = diarsipkan
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index menu_items_category_idx on public.menu_items (category_id);

create trigger menu_items_updated_at before update on public.menu_items
  for each row execute function public.set_updated_at();

-- Varian (pilih tepat 1, misal Ukuran / Saus) & topping (pilih 0..max_select)
create table public.option_groups (
  id           uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  name         text not null,
  type         text not null check (type in ('variant', 'addon')),
  is_required  boolean not null default true,  -- untuk addon: wajib pilih minimal 1?
  max_select   int not null default 1 check (max_select >= 1),
  sort_order   int not null default 0
);

create index option_groups_menu_item_idx on public.option_groups (menu_item_id);

create table public.options (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.option_groups(id) on delete cascade,
  name        text not null,
  price_delta int not null default 0 check (price_delta >= 0), -- tambahan harga
  sort_order  int not null default 0
);

create index options_group_idx on public.options (group_id);

-- ---------------------------------------------------------------------
-- Member
-- ---------------------------------------------------------------------
create table public.members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(trim(name)) > 0),
  phone      text not null unique check (phone ~ '^(08|62)[0-9]{8,12}$'),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Order
-- ---------------------------------------------------------------------
create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique,            -- TP-YYMMDD-001
  business_date    date not null,
  daily_seq        int not null,
  order_type       text not null check (order_type in ('dine_in', 'takeaway', 'ojol')),
  ojol_provider    text check (ojol_provider in ('gofood', 'grabfood', 'shopeefood')),
  ojol_order_ref   text,
  table_number     text,
  customer_name    text,
  member_id        uuid references public.members(id) on delete set null,
  member_name      text,                             -- salinan nama member
  subtotal         int not null check (subtotal >= 0),
  discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
  discount_amount  int not null default 0,
  service_amount   int not null default 0,
  tax_amount       int not null default 0,
  total            int not null check (total >= 0),
  payment_method   text not null check (payment_method in ('cash', 'qris', 'transfer', 'debit', 'ojol')),
  ojol_cash_source text check (ojol_cash_source in ('driver_cash', 'merchant_balance')),
  status           text not null default 'paid' check (status in ('paid', 'cancelled')),
  cancel_reason    text,
  cancelled_at     timestamptz,
  created_by_mode  text not null default 'cashier' check (created_by_mode in ('owner', 'cashier')),
  created_at       timestamptz not null default now(),
  unique (business_date, daily_seq),
  check (order_type <> 'dine_in' or coalesce(trim(table_number), '') <> ''),
  check (order_type <> 'ojol' or (ojol_provider is not null and payment_method = 'ojol' and ojol_cash_source is not null)),
  check (order_type = 'ojol' or payment_method <> 'ojol')
);

create index orders_business_date_idx on public.orders (business_date);
create index orders_member_idx on public.orders (member_id);

create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name         text not null,                 -- salinan nama menu
  unit_price   int not null check (unit_price >= 0), -- harga 1 porsi (termasuk varian/topping/ojol)
  cost_price   int not null default 0,        -- salinan HPP
  qty          int not null check (qty > 0),
  note         text,
  options      jsonb not null default '[]',   -- salinan pilihan: [{"group":"Ukuran","name":"Large","price_delta":5000}]
  line_total   int generated always as (unit_price * qty) stored
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_menu_item_idx on public.order_items (menu_item_id);

-- ---------------------------------------------------------------------
-- Pengeluaran
-- ---------------------------------------------------------------------
create table public.expenses (
  id                uuid primary key default gen_random_uuid(),
  description       text not null check (length(trim(description)) > 0),
  amount            int not null check (amount > 0),
  method            text not null default 'cash' check (method in ('cash', 'transfer')),
  receipt_image_url text,
  expense_date      date not null default (now() at time zone 'Asia/Jakarta')::date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index expenses_date_idx on public.expenses (expense_date);

create trigger expenses_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Riwayat stok
-- ---------------------------------------------------------------------
create table public.stock_movements (
  id           uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  type         text not null check (type in ('add', 'adjust', 'sale', 'cancel')),
  qty_change   int not null,
  qty_after    int not null,
  note         text,
  order_id     uuid references public.orders(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index stock_movements_item_idx on public.stock_movements (menu_item_id, created_at desc);

-- =====================================================================
-- Keamanan (RLS): semua data hanya untuk user yang sudah login.
-- Order & stok hanya bisa DITULIS lewat fungsi di bawah (bukan insert langsung).
-- =====================================================================
alter table public.store_settings  enable row level security;
alter table public.owner_pin       enable row level security;  -- tanpa policy = tertutup total
alter table public.categories      enable row level security;
alter table public.menu_items      enable row level security;
alter table public.option_groups   enable row level security;
alter table public.options         enable row level security;
alter table public.members         enable row level security;
alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;
alter table public.expenses        enable row level security;
alter table public.stock_movements enable row level security;

create policy "login: baca pengaturan" on public.store_settings for select to authenticated using (true);
create policy "login: ubah pengaturan" on public.store_settings for update to authenticated using (true) with check (true);

create policy "login: kelola kategori" on public.categories    for all to authenticated using (true) with check (true);
create policy "login: kelola menu"     on public.menu_items    for all to authenticated using (true) with check (true);
create policy "login: kelola grup opsi" on public.option_groups for all to authenticated using (true) with check (true);
create policy "login: kelola opsi"     on public.options       for all to authenticated using (true) with check (true);
create policy "login: kelola member"   on public.members       for all to authenticated using (true) with check (true);
create policy "login: kelola pengeluaran" on public.expenses   for all to authenticated using (true) with check (true);

create policy "login: baca order"      on public.orders          for select to authenticated using (true);
create policy "login: baca item order" on public.order_items     for select to authenticated using (true);
create policy "login: baca riwayat stok" on public.stock_movements for select to authenticated using (true);

-- Stok hanya boleh diubah lewat fungsi adjust_stock / create_order / cancel_order:
-- app boleh update semua kolom menu KECUALI stock_qty.
revoke update on public.menu_items from anon, authenticated;
grant update (category_id, name, price, cost_price, image_url, track_stock, is_archived, sort_order)
  on public.menu_items to authenticated;

-- =====================================================================
-- Fungsi PIN owner
-- =====================================================================

-- Cek PIN. Mengembalikan true/false.
create or replace function public.verify_owner_pin(p_pin text)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.owner_pin
    where id = 1 and pin_hash = extensions.crypt(p_pin, pin_hash)
  );
$$;

-- Ganti PIN (perlu PIN lama).
create or replace function public.change_owner_pin(p_old_pin text, p_new_pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_new_pin !~ '^[0-9]{4}$' then
    raise exception 'PIN harus 4 digit angka';
  end if;
  if not public.verify_owner_pin(p_old_pin) then
    return false;
  end if;
  update public.owner_pin
     set pin_hash = extensions.crypt(p_new_pin, extensions.gen_salt('bf')), updated_at = now()
   where id = 1;
  return true;
end;
$$;

-- Lupa PIN: boleh buat PIN baru TANPA PIN lama, asal baru saja login pakai password
-- (dalam 10 menit terakhir). Jadi device kasir yang sudah lama login tidak bisa memakainya.
create or replace function public.reset_owner_pin(p_new_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_password_login_at bigint;
begin
  if p_new_pin !~ '^[0-9]{4}$' then
    raise exception 'PIN harus 4 digit angka';
  end if;

  select max((m ->> 'timestamp')::bigint) into v_password_login_at
    from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as m
   where m ->> 'method' = 'password';

  if v_password_login_at is null
     or v_password_login_at < extract(epoch from now())::bigint - 600 then
    raise exception 'Silakan login ulang pakai password dulu';
  end if;

  update public.owner_pin
     set pin_hash = extensions.crypt(p_new_pin, extensions.gen_salt('bf')), updated_at = now()
   where id = 1;
end;
$$;

-- =====================================================================
-- Fungsi order
-- =====================================================================

-- Buat order baru (sekaligus potong stok). Semua berhasil atau semua batal.
--
-- p_order: {
--   "order_type": "dine_in" | "takeaway" | "ojol",
--   "ojol_provider", "ojol_order_ref", "table_number", "customer_name",
--   "member_id", "discount_percent",
--   "payment_method": "cash" | "qris" | "transfer" | "debit" | "ojol",
--   "ojol_cash_source": "driver_cash" | "merchant_balance",
--   "created_by_mode": "owner" | "cashier"
-- }
-- p_items: [{ "menu_item_id", "qty", "unit_price", "note", "options": [...] }]
--   unit_price = harga 1 porsi yang dihitung app (sudah termasuk varian, topping, harga ojol)
--
-- Subtotal, diskon, service, pajak & total dihitung ulang DI SINI (sumber kebenaran).
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

  if p_order ->> 'order_type' = 'dine_in' and coalesce(trim(p_order ->> 'table_number'), '') = '' then
    raise exception 'Nomor meja wajib diisi untuk dine-in';
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

-- Batalkan order (koreksi salah input). Stok dikembalikan.
create or replace function public.cancel_order(p_order_id uuid, p_reason text default null)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item  record;
begin
  if auth.uid() is null then
    raise exception 'Harus login';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order tidak ditemukan';
  end if;
  if v_order.status = 'cancelled' then
    raise exception 'Order sudah dibatalkan';
  end if;

  for v_item in
    select oi.menu_item_id, sum(oi.qty)::int as qty
      from public.order_items oi
      join public.menu_items m on m.id = oi.menu_item_id and m.track_stock
     where oi.order_id = p_order_id
     group by oi.menu_item_id
  loop
    update public.menu_items set stock_qty = stock_qty + v_item.qty where id = v_item.menu_item_id;
    insert into public.stock_movements (menu_item_id, type, qty_change, qty_after, order_id)
    select v_item.menu_item_id, 'cancel', v_item.qty, stock_qty, p_order_id
      from public.menu_items where id = v_item.menu_item_id;
  end loop;

  update public.orders
     set status = 'cancelled', cancel_reason = nullif(trim(p_reason), ''), cancelled_at = now()
   where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

-- Tambah stok ('add') atau set jumlah sebenarnya ('adjust').
create or replace function public.adjust_stock(p_menu_item_id uuid, p_mode text, p_qty int, p_note text default null)
returns public.menu_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_menu public.menu_items;
  v_old  int;
  v_new  int;
begin
  if auth.uid() is null then
    raise exception 'Harus login';
  end if;

  select * into v_menu from public.menu_items where id = p_menu_item_id for update;
  if not found then
    raise exception 'Menu tidak ditemukan';
  end if;
  v_old := v_menu.stock_qty;

  if p_mode = 'add' then
    if p_qty <= 0 then raise exception 'Jumlah harus lebih dari 0'; end if;
    v_new := v_menu.stock_qty + p_qty;
  elsif p_mode = 'adjust' then
    if p_qty < 0 then raise exception 'Stok tidak boleh minus'; end if;
    v_new := p_qty;
  else
    raise exception 'Mode harus add atau adjust';
  end if;

  update public.menu_items set stock_qty = v_new, track_stock = true where id = p_menu_item_id
  returning * into v_menu;

  insert into public.stock_movements (menu_item_id, type, qty_change, qty_after, note)
  values (p_menu_item_id, p_mode, v_new - v_old, v_new, nullif(trim(p_note), ''));

  return v_menu;
end;
$$;

-- Fungsi hanya untuk user login
revoke execute on function public.verify_owner_pin(text)               from public, anon;
revoke execute on function public.change_owner_pin(text, text)         from public, anon;
revoke execute on function public.reset_owner_pin(text)                from public, anon;
revoke execute on function public.create_order(jsonb, jsonb)           from public, anon;
revoke execute on function public.cancel_order(uuid, text)             from public, anon;
revoke execute on function public.adjust_stock(uuid, text, int, text)  from public, anon;
grant  execute on function public.verify_owner_pin(text)               to authenticated;
grant  execute on function public.change_owner_pin(text, text)         to authenticated;
grant  execute on function public.reset_owner_pin(text)                to authenticated;
grant  execute on function public.create_order(jsonb, jsonb)           to authenticated;
grant  execute on function public.cancel_order(uuid, text)             to authenticated;
grant  execute on function public.adjust_stock(uuid, text, int, text)  to authenticated;

-- =====================================================================
-- Realtime: order baru langsung muncul di HP owner (+ cekring)
-- =====================================================================
alter publication supabase_realtime add table public.orders;

-- =====================================================================
-- Storage: foto menu, logo toko, foto nota pengeluaran
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('menu-images',      'menu-images',      true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('store-assets',     'store-assets',     true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('expense-receipts', 'expense-receipts', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "login: upload gambar" on storage.objects for insert to authenticated
  with check (bucket_id in ('menu-images', 'store-assets', 'expense-receipts'));
create policy "login: ubah gambar" on storage.objects for update to authenticated
  using (bucket_id in ('menu-images', 'store-assets', 'expense-receipts'));
create policy "login: hapus gambar" on storage.objects for delete to authenticated
  using (bucket_id in ('menu-images', 'store-assets', 'expense-receipts'));
