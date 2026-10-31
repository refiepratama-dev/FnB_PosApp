import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";

/**
 * Suara & getar. Dipakai bersama:
 * - playCekring(): saat order dibuat (kasir) & order baru masuk (HP owner)
 * - tapFeedback(): getar ringan saat item masuk keranjang
 */
let cekringPlayer: AudioPlayer | null = null;

export function playCekring() {
  try {
    if (!cekringPlayer) {
      // tetap bunyi walau HP mode senyap (iOS)
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
      cekringPlayer = createAudioPlayer(require("../../assets/sounds/cekring.wav"));
    }
    cekringPlayer.seekTo(0).catch(() => {});
    cekringPlayer.play();
  } catch {
    // suara gagal bukan masalah besar, transaksi tetap jalan
  }
}

export function tapFeedback() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function successFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
