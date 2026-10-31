-- =====================================================================
-- Realtime untuk menu: perubahan menu, harga, stok, kategori, varian & topping
-- dari satu device langsung muncul di device lain (grid kasir, Kelola Produk, Stok).
-- =====================================================================
alter publication supabase_realtime add table public.menu_items;
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.option_groups;
alter publication supabase_realtime add table public.options;
