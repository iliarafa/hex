import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "../utils/haptics";
import { copyText } from "../utils/clipboard";
import { THEME } from "../constants/theme";
import { hexToHsl, hexToRgb } from "../utils/color";
import { useFavorites } from "../context/FavoritesContext";

interface HexDisplayProps {
  hex: string;
  /** Side panel used by the desktop workstation. Phone layout stays stacked. */
  layout?: "stack" | "panel";
}

export const HexDisplay: React.FC<HexDisplayProps> = ({ hex, layout = "stack" }) => {
  const [copied, setCopied] = useState(false);
  const rgb = hexToRgb(hex);
  const hsl = hexToHsl(hex);
  const panel = layout === "panel";
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toggleFavorite, isFav } = useFavorites();
  const saved = isFav(hex);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    await copyText(hex);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  }, [hex]);

  const handleSave = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleFavorite(hex);
  }, [hex, toggleFavorite]);

  return (
    <View style={[styles.container, panel && styles.panel]}>
      <View style={[styles.swatch, panel && styles.panelSwatch, { backgroundColor: hex, borderColor: hex }]} />

      <View style={[styles.infoRow, panel && styles.panelInfo]}>
        <TouchableOpacity onPress={handleCopy} activeOpacity={0.7}>
          <Text style={[styles.hexText, panel && styles.panelHex]}>{hex}</Text>
        </TouchableOpacity>
        {panel ? (
          <View style={styles.readouts}>
            <Text style={styles.readLabel}>RGB</Text>
            <Text style={styles.rgbText}>{rgb.r}  {rgb.g}  {rgb.b}</Text>
            <Text style={styles.readLabel}>HSL</Text>
            <Text style={styles.rgbText}>{hsl.h}  {hsl.s}  {hsl.l}</Text>
          </View>
        ) : (
          <View style={styles.rgbRow}>
            <Text style={styles.rgbText}>R:{rgb.r}</Text>
            <Text style={styles.rgbText}>G:{rgb.g}</Text>
            <Text style={styles.rgbText}>B:{rgb.b}</Text>
          </View>
        )}
      </View>

      {/* Button row */}
      <View style={[styles.buttonRow, panel && styles.panelButtons]}>
        <TouchableOpacity
          style={[styles.actionButton, copied && styles.copyButtonActive]}
          onPress={handleCopy}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, copied && styles.copyTextActive]}>
            {copied ? "COPIED!" : "COPY"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, saved && styles.saveButtonActive]}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, saved && styles.saveTextActive]}>
            {saved ? "SAVED" : "SAVE"}
          </Text>
        </TouchableOpacity>
      </View>
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
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: THEME.text,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.text,
  },
  copyButtonActive: {
    backgroundColor: THEME.text,
  },
  copyTextActive: {
    color: THEME.bg,
  },
  saveButtonActive: {
    borderColor: THEME.textBright,
  },
  saveTextActive: {
    color: THEME.textBright,
  },
  panel: {
    width: 320,
    borderLeftWidth: 1,
    borderLeftColor: THEME.border,
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: "center",
  },
  panelSwatch: {
    height: 140,
  },
  panelInfo: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 16,
  },
  panelHex: {
    color: THEME.textBright,
    textShadowColor: THEME.textBright,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  readouts: {
    gap: 8,
  },
  readLabel: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
  },
  panelButtons: {
    flexDirection: "column",
  },
});
