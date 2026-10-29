import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { THEME } from "../constants/theme";

export type DesktopMode =
  | "picker"
  | "enterHex"
  | "drawHex"
  | "challenge"
  | "colorMatch"
  | "favorites";

const MODES: { key: DesktopMode; label: string; keyHint: string }[] = [
  { key: "picker", label: "BROWSE", keyHint: "1" },
  { key: "enterHex", label: "ENTER", keyHint: "2" },
  { key: "drawHex", label: "DRAW", keyHint: "3" },
  { key: "challenge", label: "SHADES", keyHint: "4" },
  { key: "colorMatch", label: "COLOR MATCH", keyHint: "5" },
  { key: "favorites", label: "LIBRARY", keyHint: "6" },
];

interface DesktopNavProps {
  active: DesktopMode | "settings" | "drawHexEditor" | "drawHexGallery";
  onSelect: (mode: DesktopMode) => void;
  onSettings: () => void;
}

const webPointer = (
  Platform.OS === "web" ? { cursor: "pointer" } : null
) as ViewStyle | null;

/**
 * Persistent mode rail for wide web viewports. Bright green is the live
 * selection only; everything else stays dim phosphor.
 */
export function DesktopNav({ active, onSelect, onSettings }: DesktopNavProps) {
  const [hover, setHover] = useState<string | null>(null);
  const drawActive = active === "drawHex" || active === "drawHexGallery" || active === "drawHexEditor";

  return (
    <View style={styles.rail}>
      <Text style={styles.wordmark}>HEX</Text>
      <Text style={styles.kicker}>CRT COLOR</Text>

      <View style={styles.list}>
        {MODES.map((mode) => {
          const selected =
            mode.key === active || (mode.key === "drawHex" && drawActive);
          const hot = hover === mode.key && !selected;
          return (
            <Pressable
              key={mode.key}
              onPress={() => onSelect(mode.key)}
              onHoverIn={() => setHover(mode.key)}
              onHoverOut={() => setHover((current) => (current === mode.key ? null : current))}
              style={[styles.row, selected && styles.rowSelected, webPointer]}
            >
              <Text style={[styles.hint, selected && styles.hintLive]}>{mode.keyHint}</Text>
              <Text style={[styles.label, hot && styles.labelHot, selected && styles.labelLive]}>
                {selected ? "> " : "  "}
                {mode.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onSettings}
        onHoverIn={() => setHover("settings")}
        onHoverOut={() => setHover((current) => (current === "settings" ? null : current))}
        style={[styles.settings, webPointer]}
      >
        <Text
          style={[
            styles.settingsText,
            active === "settings" && styles.labelLive,
            hover === "settings" && active !== "settings" && styles.labelHot,
          ]}
        >
          {active === "settings" ? "> SETTINGS" : "  SETTINGS"}
        </Text>
      </Pressable>

      {Platform.OS === "web" ? <View pointerEvents="none" style={styles.scan} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: 232,
    backgroundColor: THEME.bg,
    borderRightWidth: 1,
    borderRightColor: THEME.border,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  wordmark: {
    fontFamily: THEME.fontFamily,
    fontSize: 22,
    color: "#ffffff",
    textShadowColor: "#ffffff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  kicker: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    marginTop: 8,
    marginBottom: 28,
  },
  list: {
    flex: 1,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 10,
  },
  rowSelected: {
    borderColor: THEME.border,
    backgroundColor: THEME.bgSecondary,
  },
  hint: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    width: 12,
  },
  hintLive: {
    color: THEME.textBright,
  },
  label: {
    fontFamily: THEME.fontFamily,
    fontSize: 10,
    color: THEME.textDim,
    flex: 1,
  },
  labelHot: {
    color: THEME.text,
  },
  labelLive: {
    color: THEME.textBright,
    textShadowColor: THEME.textBright,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  settings: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  settingsText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
  },
  scan: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage:
      "repeating-linear-gradient(to bottom, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 4px)",
  } as ViewStyle,
});
