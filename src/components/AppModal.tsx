import React from "react";
import { Modal, Platform, StyleSheet, View, type ModalProps } from "react-native";
import { THEME } from "../constants/theme";
import { useBackHandler } from "../utils/backHandler";

/**
 * Native uses the system modal. On web the overlay stays inside the phone frame
 * (RN Modal portals to document.body and would cover the whole desktop window).
 */
export function AppModal({
  visible = false,
  transparent,
  animationType,
  onRequestClose,
  children,
}: ModalProps) {
  useBackHandler(10, visible && !!onRequestClose, () => {
    onRequestClose?.({} as never);
  });

  if (Platform.OS !== "web") {
    return (
      <Modal
        visible={visible}
        transparent={transparent}
        animationType={animationType}
        onRequestClose={onRequestClose}
      >
        {children}
      </Modal>
    );
  }

  if (!visible) return null;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.webLayer,
        transparent ? null : styles.opaque,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  webLayer: {
    zIndex: 50,
  },
  opaque: {
    backgroundColor: THEME.bg,
  },
});
