-- Saldo kas kecil berjalan per toko. Saldo awal yang dimasukkan adalah
-- jumlah kas yang tersedia saat ini; sisa saldo terus terbawa ke hari berikutnya.
alter table public.store_settings
  add column petty_cash_opening_balance bigint not null default 0 check (petty_cash_opening_balance >= 0),
  add column petty_cash_opening_date date;

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
  v_total_expenses bigint;
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan';
  end if;

  select s.petty_cash_opening_balance, s.petty_cash_opening_date
    into v_opening_balance, v_opening_date
    from public.store_settings s
   where s.id = 1;

  if not found then
    raise exception 'Pengaturan toko tidak ditemukan';
  end if;

  if v_opening_date is null then
    select coalesce(sum(e.amount), 0)::bigint
      into v_total_expenses
      from public.expenses e;
  else
    select coalesce(sum(e.amount), 0)::bigint
      into v_total_expenses
      from public.expenses e
     where e.expense_date >= v_opening_date;
  end if;

  return query
  select
    v_opening_balance,
    v_opening_date,
    least(v_opening_balance, v_total_expenses),
    greatest(v_total_expenses - v_opening_balance, 0),
    greatest(v_opening_balance - v_total_expenses, 0);
end;
$$;

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
   where s.id = 1;
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
         petty_cash_opening_date = v_today
   where id = 1;
end;
$$;

revoke all on function public.get_petty_cash_summary() from public;
grant execute on function public.get_petty_cash_summary() to authenticated;
revoke all on function public.set_petty_cash_balance(bigint) from public;
grant execute on function public.set_petty_cash_balance(bigint) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'store_settings'
  ) then
    alter publication supabase_realtime add table public.store_settings;
  end if;
end $$;
