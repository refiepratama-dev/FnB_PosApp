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
  v_before_opening bigint := 0;
  v_total_since_opening bigint := 0;
  v_total_before_range bigint := 0;
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan';
  end if;
  if p_from is null or p_to is null or p_from > p_to then
    raise exception 'Rentang tanggal pengeluaran tidak valid';
  end if;

  select s.petty_cash_opening_balance, s.petty_cash_opening_date
    into v_opening_balance, v_opening_date
    from public.store_settings s
   where s.id = 1;
  if not found then
    raise exception 'Pengaturan toko tidak ditemukan';
  end if;

  if v_opening_date is null or p_to < v_opening_date then
    select coalesce(sum(e.amount), 0)::bigint
      into v_before_opening
      from public.expenses e
     where e.expense_date between p_from and p_to;
    return v_before_opening;
  end if;

  if p_from < v_opening_date then
    select coalesce(sum(e.amount), 0)::bigint
      into v_before_opening
      from public.expenses e
     where e.expense_date between p_from and least(p_to, v_opening_date - 1);
  end if;

  select coalesce(sum(e.amount), 0)::bigint
    into v_total_since_opening
    from public.expenses e
   where e.expense_date >= v_opening_date
     and e.expense_date <= p_to;

  if p_from > v_opening_date then
    select coalesce(sum(e.amount), 0)::bigint
      into v_total_before_range
      from public.expenses e
     where e.expense_date >= v_opening_date
       and e.expense_date < p_from;
  end if;

  return v_before_opening
    + greatest(v_total_since_opening - v_opening_balance, 0)
    - greatest(v_total_before_range - v_opening_balance, 0);
end;
$$;

revoke all on function public.get_expenses_from_income(date, date) from public;
grant execute on function public.get_expenses_from_income(date, date) to authenticated;
