import { useMemo } from "react";
import { View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { qrMatrix, type QrLevel } from "@/lib/qr";

const QUIET_ZONE = 4; // margin putih di sekeliling QR (wajib supaya mudah dipindai)

/**
 * Gambar QR code. Digambar dengan react-native-svg (sudah terpasang), tanpa library tambahan.
 *
 *   <QrCode value={buildStoreCode(connection)} size={260} />
 */
export function QrCode({ value, size = 240, level = "L" }: { value: string; size?: number; level?: QrLevel }) {
  const result = useMemo(() => {
    let modules: boolean[][];
    try {
      modules = qrMatrix(value, level);
    } catch {
      return null; // teks terlalu panjang untuk satu QR
    }
    const n = modules.length;
    let d = "";
    // gabungkan kotak hitam yang berderet di satu baris supaya path tidak terlalu panjang
    for (let y = 0; y < n; y++) {
      let x = 0;
      while (x < n) {
        if (!modules[y][x]) {
          x++;
          continue;
        }
        let run = 1;
        while (x + run < n && modules[y][x + run]) run++;
        d += `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h${run}v1h-${run}z`;
        x += run;
      }
    }
    return { path: d, count: n + QUIET_ZONE * 2 };
  }, [value, level]);

  if (!result) return <View style={{ width: size, height: size }} />;
  const { path, count } = result;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${count} ${count}`}>
        <Rect x={0} y={0} width={count} height={count} fill="#FFFFFF" />
        <Path d={path} fill="#000000" />
      </Svg>
    </View>
  );
}
