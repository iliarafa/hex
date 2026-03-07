import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { THEME } from "../constants/theme";

interface ModeSelectScreenProps {
  onBack: () => void;
  onSelect: (mode: "picker" | "single" | "multi") => void;
}

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

      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => onSelect("picker")}
        >
          <Text style={styles.modeTitle}>HEX FINDER</Text>
          <Text style={styles.modeDesc}>EXPLORE THE{"\n"}COLOR SPECTRUM</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => onSelect("single")}
        >
          <Text style={styles.modeTitle}>SINGLE HEX</Text>
          <Text style={styles.modeDesc}>SORT 8 SHADES{"\n"}OF ONE COLOR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => onSelect("multi")}
        >
          <Text style={styles.modeTitle}>MULTI HEX</Text>
          <Text style={styles.modeDesc}>SORT 8 DIFFERENT{"\n"}COLORS</Text>
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
  modeContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 20,
  },
  modeButton: {
    borderWidth: 2,
    borderColor: THEME.border,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  modeTitle: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeLarge,
    color: THEME.text,
    marginBottom: 8,
  },
  modeDesc: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    textAlign: "center",
    lineHeight: 16,
  },
});
