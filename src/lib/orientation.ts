import { useEffect } from "react";
import * as ScreenOrientation from "expo-screen-orientation";

type Mode = "landscape" | "portrait" | "free";

const locks = {
  landscape: ScreenOrientation.OrientationLock.LANDSCAPE,
  portrait: ScreenOrientation.OrientationLock.PORTRAIT_UP,
  free: ScreenOrientation.OrientationLock.DEFAULT,
};

/**
 * Kunci orientasi layar selama layar/layout ini tampil.
 * - Kasir  -> "landscape"
 * - Owner  -> "portrait"
 * - Layar awal (login, PIN, scan QR) -> "free"
 */
export function useOrientation(mode: Mode) {
  useEffect(() => {
    ScreenOrientation.lockAsync(locks[mode]).catch(() => {
      // Di web / beberapa device kunci orientasi tidak didukung. Aman diabaikan.
    });
  }, [mode]);
}
