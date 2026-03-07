import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { THEME } from "../constants/theme";
import { PuzzleGrid } from "./PuzzleGrid";
import { generatePuzzle, Tile, PuzzleMode } from "../utils/puzzle";

interface ChallengeScreenProps {
  onBack: () => void;
}

export const ChallengeScreen: React.FC<ChallengeScreenProps> = ({ onBack }) => {
  const [mode, setMode] = useState<PuzzleMode | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [solved, setSolved] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const startGame = useCallback((selectedMode: PuzzleMode) => {
    setMode(selectedMode);
    setTiles(generatePuzzle(selectedMode));
    setSolved(false);
    setElapsed(0);
    startTimeRef.current = Date.now();
  }, []);

  // Timer
  useEffect(() => {
    if (mode && !solved) {
      timerRef.current = setInterval(() => {
        setElapsed((Date.now() - startTimeRef.current) / 1000);
      }, 100);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [mode, solved]);

  const handleSolved = useCallback(() => {
    setSolved(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsed((Date.now() - startTimeRef.current) / 1000);
  }, []);

  const handleNewGame = () => {
    setMode(null);
    setTiles([]);
    setSolved(false);
    setElapsed(0);
  };

  // Mode selection screen
  if (!mode) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={onBack} style={styles.backButtonContainer}>
              <Text style={styles.backButton}>{"<"}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>CHALLENGE</Text>
            <View style={styles.backButtonSpacer} />
          </View>
          <Text style={styles.subtitle}>CHOOSE MODE</Text>
        </View>

        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => startGame("single")}
          >
            <Text style={styles.modeTitle}>SINGLE HEX</Text>
            <Text style={styles.modeDesc}>SORT 8 SHADES{"\n"}OF ONE COLOR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => startGame("multi")}
          >
            <Text style={styles.modeTitle}>MULTI HEX</Text>
            <Text style={styles.modeDesc}>SORT 8 DIFFERENT{"\n"}COLORS</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Game screen
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={handleNewGame} style={styles.backButtonContainer}>
            <Text style={styles.backButton}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>CHALLENGE</Text>
          <View style={styles.backButtonSpacer} />
        </View>
        <Text style={styles.subtitle}>
          {mode === "single" ? "SINGLE HEX" : "MULTI HEX"}
        </Text>
      </View>

      <View style={styles.gridContainer}>
        <PuzzleGrid
          tiles={tiles}
          onTilesChange={setTiles}
          onSolved={handleSolved}
        />
      </View>

      <View style={styles.footer}>
        {solved ? (
          <View style={styles.solvedContainer}>
            <Text style={styles.solvedText}>SOLVED!</Text>
            <Text style={styles.timeText}>{elapsed.toFixed(1)}s</Text>
            <TouchableOpacity style={styles.newGameButton} onPress={handleNewGame}>
              <Text style={styles.newGameText}>NEW GAME</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.timerText}>{elapsed.toFixed(1)}s</Text>
        )}
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
    color: THEME.textDim,
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
  gridContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  timerText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
  },
  solvedContainer: {
    alignItems: "center",
  },
  solvedText: {
    fontFamily: THEME.fontFamily,
    fontSize: 24,
    color: THEME.text,
    marginBottom: 4,
  },
  timeText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
    marginBottom: 16,
  },
  newGameButton: {
    borderWidth: 2,
    borderColor: THEME.text,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  newGameText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.text,
  },
});
