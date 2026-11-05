-- Kas tambahan terlebih dahulu mengganti pengeluaran yang sempat memakai pemasukan.
-- Kelebihan setelah penggantian menjadi saldo kas kecil yang tersedia.
alter table public.store_settings add column petty_cash_opening_at timestamptz;

create table public.petty_cash_replenishments (
  id uuid primary key default gen_random_uuid(),
  amount bigint not null check (amount > 0 and amount <= 2000000000),
  created_at timestamptz not null default clock_timestamp()
);

alter table public.petty_cash_replenishments enable row level security;
create policy "login: baca penambahan kas kecil"
  on public.petty_cash_replenishments for select to authenticated using (true);
create policy "login: tambah kas kecil"
  on public.petty_cash_replenishments for insert to authenticated with check (true);
grant select, insert on public.petty_cash_replenishments to authenticated;

create or replace function public.add_petty_cash(p_amount bigint)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_opening_date date;
  v_opening_at timestamptz;
  v_timezone text;
  v_today date;
  v_today_expenses bigint;
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 2000000000 then
    raise exception 'Penambahan kas kecil harus antara Rp1 dan Rp2.000.000.000';
  end if;

  select s.petty_cash_opening_date, s.petty_cash_opening_at, s.timezone
    into v_opening_date, v_opening_at, v_timezone
    from public.store_settings s
   where s.id = 1
   for update;
  if not found then
    raise exception 'Pengaturan toko tidak ditemukan';
  end if;

  if v_opening_date is null then
    v_today := (now() at time zone v_timezone)::date;
    select coalesce(sum(e.amount), 0)::bigint
      into v_today_expenses
      from public.expenses e
     where e.expense_date = v_today;
    update public.store_settings
       set petty_cash_opening_balance = p_amount + v_today_expenses,
           petty_cash_opening_date = v_today,
           petty_cash_opening_at = clock_timestamp()
     where id = 1;
    return;
  end if;

  insert into public.petty_cash_replenishments (amount) values (p_amount);
end;
$$;

revoke all on function public.add_petty_cash(bigint) from public;
grant execute on function public.add_petty_cash(bigint) to authenticated;

create or replace function public.set_petty_cash_balance(p_balance bigint)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_timezone text;
  v_today date;
  v_today_expenses bigint;
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan';
  end if;
  if p_balance is null or p_balance < 0 or p_balance > 2000000000 then
    raise exception 'Saldo kas kecil harus antara Rp0 dan Rp2.000.000.000';
  end if;

  select s.timezone into v_timezone
    from public.store_settings s
   where s.id = 1
   for update;
  if not found then
    raise exception 'Pengaturan toko tidak ditemukan';
  end if;

  v_today := (now() at time zone v_timezone)::date;
  select coalesce(sum(e.amount), 0)::bigint
    into v_today_expenses
    from public.expenses e
   where e.expense_date = v_today;

  update public.store_settings
     set petty_cash_opening_balance = p_balance + v_today_expenses,
         petty_cash_opening_date = v_today,
         petty_cash_opening_at = clock_timestamp()
   where id = 1;
end;
$$;

revoke all on function public.set_petty_cash_balance(bigint) from public;
grant execute on function public.set_petty_cash_balance(bigint) to authenticated;

create or replace function public.get_petty_cash_summary()
returns table (
  opening_balance bigint,
  opening_date date,
  spent_from_petty_cash bigint,
  spent_from_income bigint,
  remaining_balance bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_opening_balance bigint;
  v_opening_date date;
  v_opening_at timestamptz;
  v_timezone text;
  v_total_expenses bigint;
  v_total_replenishments bigint;
  v_available_petty_cash bigint;
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan';
  end if;

  select s.petty_cash_opening_balance, s.petty_cash_opening_date, s.petty_cash_opening_at, s.timezone
    into v_opening_balance, v_opening_date, v_opening_at, v_timezone
    from public.store_settings s
   where s.id = 1;
  if not found then
    raise exception 'Pengaturan toko tidak ditemukan';
  end if;

  if v_opening_date is null then
    v_total_expenses := 0;
    v_total_replenishments := 0;
  else
    select coalesce(sum(e.amount), 0)::bigint
      into v_total_expenses
      from public.expenses e
     where e.expense_date >= v_opening_date;

    select coalesce(sum(r.amount), 0)::bigint
      into v_total_replenishments
      from public.petty_cash_replenishments r
     where case
       when v_opening_at is not null then r.created_at >= v_opening_at
       else (r.created_at at time zone v_timezone)::date >= v_opening_date
     end;
  end if;

  v_available_petty_cash := v_opening_balance + v_total_replenishments;
  return query
  select
    v_opening_balance,
    v_opening_date,
    least(v_available_petty_cash, v_total_expenses),
    greatest(v_total_expenses - v_available_petty_cash, 0),
    greatest(v_available_petty_cash - v_total_expenses, 0);
end;
$$;

create or replace function public.get_expenses_from_income(p_from date, p_to date)
returns bigint
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_opening_balance bigint;
  v_opening_date date;
  v_opening_at timestamptz;
  v_timezone text;
  v_expenses_before_opening bigint := 0;
  v_expenses_to_end bigint := 0;
  v_replenishments_to_end bigint := 0;
  v_expenses_before_range bigint := 0;
  v_replenishments_before_range bigint := 0;
  v_income_balance_at_end bigint := 0;
  v_income_balance_before_range bigint := 0;
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan';
  end if;
  if p_from is null or p_to is null or p_from > p_to then
    raise exception 'Rentang tanggal pengeluaran tidak valid';
  end if;

  select s.petty_cash_opening_balance, s.petty_cash_opening_date, s.petty_cash_opening_at, s.timezone
    into v_opening_balance, v_opening_date, v_opening_at, v_timezone
    from public.store_settings s
   where s.id = 1;
  if not found then
    raise exception 'Pengaturan toko tidak ditemukan';
  end if;

  if v_opening_date is null or p_to < v_opening_date then
    select coalesce(sum(e.amount), 0)::bigint
      into v_expenses_before_opening
      from public.expenses e
     where e.expense_date between p_from and p_to;
    return v_expenses_before_opening;
  end if;

  if p_from < v_opening_date then
    select coalesce(sum(e.amount), 0)::bigint
      into v_expenses_before_opening
      from public.expenses e
     where e.expense_date between p_from and least(p_to, v_opening_date - 1);
  end if;

  select coalesce(sum(e.amount), 0)::bigint
    into v_expenses_to_end
    from public.expenses e
   where e.expense_date >= v_opening_date
     and e.expense_date <= p_to;

  select coalesce(sum(r.amount), 0)::bigint
    into v_replenishments_to_end
    from public.petty_cash_replenishments r
   where case
     when v_opening_at is not null then r.created_at >= v_opening_at
     else (r.created_at at time zone v_timezone)::date >= v_opening_date
   end;

  if p_from > v_opening_date then
    select coalesce(sum(e.amount), 0)::bigint
      into v_expenses_before_range
      from public.expenses e
     where e.expense_date >= v_opening_date
       and e.expense_date < p_from;

    select coalesce(sum(r.amount), 0)::bigint
      into v_replenishments_before_range
      from public.petty_cash_replenishments r
     where case
       when v_opening_at is not null then r.created_at >= v_opening_at
       else (r.created_at at time zone v_timezone)::date >= v_opening_date
     end;
  end if;

  v_income_balance_at_end := greatest(
    v_expenses_to_end - v_opening_balance - v_replenishments_to_end,
    0
  );
  v_income_balance_before_range := greatest(
    v_expenses_before_range - v_opening_balance - v_replenishments_before_range,
    0
  );

  return v_expenses_before_opening
    + v_income_balance_at_end
    - v_income_balance_before_range;
end;
$$;

revoke all on function public.get_petty_cash_summary() from public;
grant execute on function public.get_petty_cash_summary() to authenticated;
revoke all on function public.get_expenses_from_income(date, date) from public;
grant execute on function public.get_expenses_from_income(date, date) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'petty_cash_replenishments'
  ) then
    alter publication supabase_realtime add table public.petty_cash_replenishments;
  end if;
end $$;
