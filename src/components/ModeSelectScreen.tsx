import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { THEME } from "../constants/theme";

export type ModeKey =
  | "picker"
  | "single"
  | "colorMatch"
  | "enterHex"
  | "favorites"
  | "drawHex";

interface ModeSelectScreenProps {
  onBack: () => void;
  onSelect: (mode: ModeKey) => void;
  onSettings: () => void;
}

const MODES: {
  key: ModeKey;
  label: string;
  desc: string;
}[] = [
  { key: "picker", label: "FIND HEX", desc: "BROWSE THE SPECTRUM" },
  { key: "enterHex", label: "ENTER HEX", desc: "HEX OR COLOR NAME" },
  { key: "drawHex", label: "DRAW HEX", desc: "PIXEL ART + PNG EXPORT" },
  { key: "single", label: "SINGLE HEX", desc: "SORT 8 SHADES" },
  { key: "colorMatch", label: "MATCH HEX", desc: "WORD VS COLOR?" },
  { key: "favorites", label: "MY HEX", desc: "SAVED COLORS" },
];

export const ModeSelectScreen: React.FC<ModeSelectScreenProps> = ({ onBack, onSelect, onSettings }) => {
  return (
    <View style={styles.root}>
      <View style={styles.treeContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.treeRoot}>HEX</Text>
          <TouchableOpacity onPress={onSettings} style={styles.settingsButton}>
            <Text style={styles.settingsIcon}>{"[=]"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.branchRow}>
          <Text style={styles.treeLine}>{"│"}</Text>
        </View>

        {MODES.map((mode, i) => {
          const isLast = i === MODES.length - 1;
          const branch = isLast ? "└── " : "├── ";
          const cont = isLast ? "    " : "│   ";

          return (
            <React.Fragment key={mode.key}>
              <TouchableOpacity
                style={styles.branchRow}
                onPress={() => onSelect(mode.key)}
              >
                <Text style={styles.treeLine}>{branch}</Text>
                <Text style={styles.branchLabel}>{mode.label}</Text>
              </TouchableOpacity>

              <View style={styles.branchRow}>
                <Text style={[styles.treeLine, styles.treeLineDesc]}>{cont}</Text>
                <Text style={styles.branchDesc}>{mode.desc}</Text>
              </View>

              {!isLast && (
                <View style={styles.branchRow}>
                  <Text style={[styles.treeLine, styles.treeLineDesc]}>{"│"}</Text>
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>EXIT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  footer: {
    paddingVertical: 24,
    alignItems: "center",
  },
  backText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
  },
  treeContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  treeRoot: {
    fontFamily: THEME.fontFamily,
    fontSize: 28,
    color: "#ffffff",
    textShadowColor: "rgba(255,255,255,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
  },
  branchRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  treeLine: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeLarge,
    color: THEME.textDim,
    lineHeight: 22,
  },
  treeLineDesc: {
    lineHeight: 18,
  },
  branchLabel: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeLarge,
    color: THEME.text,
    lineHeight: 22,
  },
  branchDesc: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
    lineHeight: 18,
  },
});
