-- Keterangan menu (opsional), misal "Isi 2 potong, pedas sedang".
-- Tampil di form Kelola Produk, kartu menu kasir, dan popup varian/topping.
alter table public.menu_items add column if not exists description text;

-- app boleh mengubah kolom ini (kolom menu lain sudah diizinkan di migration init)
grant update (description) on public.menu_items to authenticated;
