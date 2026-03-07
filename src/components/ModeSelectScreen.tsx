import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { THEME } from "../constants/theme";

interface ModeSelectScreenProps {
  onBack: () => void;
  onSelect: (mode: "picker" | "single" | "multi" | "enterHex") => void;
}

const MODES: {
  key: "picker" | "single" | "multi" | "enterHex";
  label: string;
  desc: string[];
}[] = [
  { key: "picker", label: "HEX FINDER", desc: ["EXPLORE THE", "COLOR SPECTRUM"] },
  { key: "single", label: "SINGLE HEX", desc: ["SORT 8 SHADES", "OF ONE COLOR"] },
  { key: "multi", label: "MULTI HEX", desc: ["SORT 8 DIFFERENT", "COLORS"] },
  { key: "enterHex", label: "ENTER HEX", desc: ["TYPE A HEX CODE", "SEE THE COLOR"] },
];

export const ModeSelectScreen: React.FC<ModeSelectScreenProps> = ({ onBack, onSelect }) => {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={onBack} style={styles.backButtonContainer}>
            <Text style={styles.backButton}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>HEX</Text>
          <View style={styles.backButtonSpacer} />
        </View>
        <Text style={styles.subtitle}>CHOOSE MODE</Text>
      </View>

      <View style={styles.treeContainer}>
        <Text style={styles.treeRoot}>HEX</Text>
        <View style={styles.branchRow}>
          <Text style={styles.treeLine}>{"│"}</Text>
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

              {mode.desc.map((line, j) => (
                <View style={styles.branchRow} key={j}>
                  <Text style={styles.treeLine}>{cont}</Text>
                  <Text style={styles.branchDesc}>{line}</Text>
                </View>
              ))}

              {!isLast && (
                <View style={styles.branchRow}>
                  <Text style={styles.treeLine}>{"│"}</Text>
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonContainer: {
    width: 40,
  },
  backButtonSpacer: {
    width: 40,
  },
  backButton: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeXL,
    color: THEME.textDim,
  },
  title: {
    flex: 1,
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeXL,
    color: "#ffffff",
    textShadowColor: "#ffffff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    textAlign: "center",
    marginTop: 4,
  },
  treeContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  treeRoot: {
    fontFamily: THEME.fontFamily,
    fontSize: 24,
    color: THEME.text,
    marginBottom: 8,
  },
  branchRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  treeLine: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeLarge,
    color: THEME.textDim,
    lineHeight: 28,
  },
  branchLabel: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeLarge,
    color: THEME.text,
    lineHeight: 28,
  },
  branchDesc: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
    lineHeight: 28,
  },
});
