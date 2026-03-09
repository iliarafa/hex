import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { THEME } from "../constants/theme";
import { PuzzleGrid } from "./PuzzleGrid";
import { generatePuzzle, Tile } from "../utils/puzzle";
import { hslToHex } from "../utils/color";

interface ChallengeScreenProps {
  onBack: () => void;
}

export const ChallengeScreen: React.FC<ChallengeScreenProps> = ({ onBack }) => {
  const [{ tiles: initialTiles, hue: initialHue }] = useState(() => generatePuzzle());
  const [tiles, setTiles] = useState<Tile[]>(initialTiles);
  const [hue, setHue] = useState(initialHue);
  const [solved, setSolved] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  const startGame = useCallback(() => {
    const { tiles: newTiles, hue: newHue } = generatePuzzle();
    setTiles(newTiles);
    setHue(newHue);
    setSolved(false);
    setElapsed(0);
    startTimeRef.current = Date.now();
  }, []);

  // Timer
  useEffect(() => {
    if (!solved) {
      timerRef.current = setInterval(() => {
        setElapsed((Date.now() - startTimeRef.current) / 1000);
      }, 100);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [solved]);

  const handleSolved = useCallback(() => {
    setSolved(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsed((Date.now() - startTimeRef.current) / 1000);
  }, []);

  const accentColor = hslToHex(hue, 60, 50);

  // Game screen
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButtonContainer}>
          <Text style={[styles.backButton, { color: accentColor }]}>{"<"}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { color: accentColor }]}>SINGLE HEX</Text>

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
            <Text style={[styles.solvedText, { color: accentColor }]}>SOLVED!</Text>
            <Text style={[styles.timeText, { color: accentColor }]}>{elapsed.toFixed(1)}s</Text>
            <TouchableOpacity style={[styles.newGameButton, { borderColor: accentColor }]} onPress={startGame}>
              <Text style={[styles.newGameText, { color: accentColor }]}>NEW GAME</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={[styles.timerText, { color: accentColor }]}>{elapsed.toFixed(1)}s</Text>
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
  backButtonContainer: {
    width: 40,
  },
  backButton: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeXL,
    color: THEME.textDim,
  },
  title: {
    fontFamily: THEME.fontFamily,
    fontSize: 24,
    color: THEME.text,
    textAlign: "center",
    alignSelf: "center",
    textShadowColor: "rgba(255,255,255,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginTop: 60,
  },
  subtitle: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    textAlign: "center",
    marginTop: 4,
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
    fontSize: 24,
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
    fontSize: 24,
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
