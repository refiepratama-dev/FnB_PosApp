-- =====================================================================
-- Realtime untuk pengeluaran: tambah / ubah / hapus pengeluaran di satu device
-- langsung ter-update di halaman Pengeluaran, Laporan, dan Dashboard device lain.
-- Aman dijalankan ulang (dicek dulu apakah tabel sudah terdaftar).
-- =====================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'expenses'
  ) then
    alter publication supabase_realtime add table public.expenses;
  end if;
end $$;
