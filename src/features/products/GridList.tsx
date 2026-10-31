import { useMemo } from "react";
import { FlatList, View, useWindowDimensions } from "react-native";

/** Jumlah kolom mengikuti lebar layar: HP portrait 1, tablet / HP landscape 2, tablet landscape 3. */
export function useGridColumns(): number {
  const { width } = useWindowDimensions();
  if (width >= 1100) return 3;
  if (width >= 700) return 2;
  return 1;
}

/**
 * Daftar kartu yang otomatis 1-3 kolom (enak di Owner portrait maupun Kasir landscape).
 * Dipakai halaman Kelola Produk, Stok, dan Member.
 */
export function GridList<T>({
  data,
  keyExtractor,
  renderItem,
  header,
  empty,
  refreshing,
  onRefresh,
}: {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => React.ReactElement;
  header?: React.ReactElement | null;
  empty?: React.ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const columns = useGridColumns();

  // Baris terakhir diisi kotak kosong supaya kartu tidak melebar sendirian
  const padded = useMemo(() => {
    const remainder = data.length % columns;
    if (columns === 1 || remainder === 0) return data as (T | null)[];
    return [...data, ...Array<null>(columns - remainder).fill(null)] as (T | null)[];
  }, [data, columns]);

  return (
    <FlatList
      key={columns} // ganti jumlah kolom (putar layar) butuh FlatList baru
      numColumns={columns}
      data={padded}
      keyExtractor={(item, index) => (item ? keyExtractor(item) : `pad-${index}`)}
      renderItem={({ item }) => <View className="flex-1 p-1.5">{item ? renderItem(item) : null}</View>}
      ListHeaderComponent={header ?? undefined}
      ListEmptyComponent={empty ?? undefined}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerClassName="grow p-3.5"
      keyboardShouldPersistTaps="handled"
    />
  );
}
