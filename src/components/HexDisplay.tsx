import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { THEME } from "../constants/theme";
import { hexToRgb } from "../utils/color";

interface HexDisplayProps {
  hex: string;
}

export const HexDisplay: React.FC<HexDisplayProps> = ({ hex }) => {
  const [copied, setCopied] = useState(false);
  const rgb = hexToRgb(hex);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(hex);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [hex]);

  return (
    <View style={styles.container}>
      {/* Color swatch */}
      <View style={[styles.swatch, { backgroundColor: hex, borderColor: hex }]} />

      {/* Hex + RGB info row */}
      <View style={styles.infoRow}>
        <TouchableOpacity onPress={handleCopy} activeOpacity={0.7}>
          <Text style={styles.hexText}>{hex}</Text>
        </TouchableOpacity>
        <View style={styles.rgbRow}>
          <Text style={styles.rgbText}>R:{rgb.r}</Text>
          <Text style={styles.rgbText}>G:{rgb.g}</Text>
          <Text style={styles.rgbText}>B:{rgb.b}</Text>
        </View>
      </View>

      {/* Copy button */}
      <TouchableOpacity
        style={[styles.copyButton, copied && styles.copyButtonActive]}
        onPress={handleCopy}
        activeOpacity={0.7}
      >
        <Text style={[styles.copyText, copied && styles.copyTextActive]}>
          {copied ? "COPIED!" : "COPY"}
        </Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: THEME.bg,
  },
  swatch: {
    width: "100%",
    height: 64,
    borderWidth: 2,
    borderColor: THEME.border,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  hexText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeXL,
    color: THEME.text,
  },
  rgbRow: {
    flexDirection: "row",
    gap: 16,
  },
  rgbText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
  },
  copyButton: {
    borderWidth: 2,
    borderColor: THEME.text,
    paddingVertical: 12,
    alignItems: "center",
  },
  copyButtonActive: {
    backgroundColor: THEME.text,
  },
  copyText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.text,
  },
  copyTextActive: {
    color: THEME.bg,
  },
});
