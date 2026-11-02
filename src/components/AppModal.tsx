import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "./AppText";
import { colors } from "@/constants/colors";

/**
 * Popup di tengah layar (popup varian, form tambah, konfirmasi bayar, dll).
 *
 *   <AppModal visible={open} title="Tambah Menu" onClose={() => setOpen(false)}
 *     footer={<Button title="Simpan" onPress={save} />}>
 *     ...isi form...
 *   </AppModal>
 */
export function AppModal({
  visible,
  title,
  onClose,
  children,
  footer,
  size = "md",
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
}) {
  // jaga jarak dari status bar & tombol navigasi Android (home/back) supaya tombol tidak tertutup
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: Math.max(16, insets.top),
    paddingBottom: Math.max(16, insets.bottom),
    paddingLeft: Math.max(16, insets.left),
    paddingRight: Math.max(16, insets.right),
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} supportedOrientations={["portrait", "landscape"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <View style={pad} className="flex-1 items-center justify-center bg-black/40">
          <Pressable className="absolute inset-0" onPress={onClose} />
          <View className={`max-h-full w-full overflow-hidden rounded-3xl bg-white ${size === "lg" ? "max-w-2xl" : "max-w-lg"}`}>
            <View className="h-16 flex-row items-center justify-between border-b border-line pl-5 pr-3">
              <AppText variant="heading" numberOfLines={1} className="flex-1 text-lg">
                {title}
              </AppText>
              <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full active:bg-panel">
                <X size={22} color={colors.ink} />
              </Pressable>
            </View>
            <ScrollView contentContainerClassName="p-5" keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
            {footer ? <View className="border-t border-line p-4">{footer}</View> : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
