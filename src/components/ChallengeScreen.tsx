import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { ColorSpectrum } from "./ColorSpectrum";
import { THEME } from "../constants/theme";
import { colorDistance, randomHex, hexToRgb } from "../utils/color";

const MATCH_THRESHOLD = 30;
const MAX_DISTANCE = 441; // sqrt(255^2 * 3)

interface ChallengeScreenProps {
  onBack: () => void;
}

export const ChallengeScreen: React.FC<ChallengeScreenProps> = ({ onBack }) => {
  const [targetHex, setTargetHex] = useState(randomHex);
  const [currentHex, setCurrentHex] = useState("#000000");
  const [distance, setDistance] = useState(MAX_DISTANCE);
  const [matched, setMatched] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [score, setScore] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  // Start timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(((Date.now() - startTimeRef.current) / 1000));
    }, 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [targetHex]);

  const handleColorChange = useCallback(
    (hex: string, _h: number, _s: number, _l: number) => {
      if (matched) return;
      setCurrentHex(hex);
      const dist = colorDistance(hex, targetHex);
      setDistance(dist);

      if (dist < MATCH_THRESHOLD) {
        setMatched(true);
        if (timerRef.current) clearInterval(timerRef.current);
        const finalTime = (Date.now() - startTimeRef.current) / 1000;
        setElapsed(finalTime);
        const accuracy = Math.round((1 - dist / MAX_DISTANCE) * 100);
        setScore(accuracy);
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) setBestStreak(newStreak);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    [targetHex, matched, streak, bestStreak]
  );

  const handleNext = () => {
    setTargetHex(randomHex());
    setCurrentHex("#000000");
    setDistance(MAX_DISTANCE);
    setMatched(false);
    setScore(0);
  };

  const targetRgb = hexToRgb(targetHex);
  const distancePercent = Math.max(0, Math.round((1 - distance / MAX_DISTANCE) * 100));

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>{"<"}</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.title}>CHALLENGE</Text>
          {bestStreak > 0 && (
            <Text style={styles.streakText}>BEST:{bestStreak}</Text>
          )}
        </View>
      </View>

      {/* Target */}
      <View style={styles.targetSection}>
        <Text style={styles.targetLabel}>FIND THIS COLOR</Text>
        <View style={styles.targetRow}>
          <View style={[styles.targetSwatch, { backgroundColor: targetHex }]} />
          <View>
            <Text style={styles.targetHex}>{targetHex}</Text>
            <Text style={styles.targetRgb}>
              R:{targetRgb.r} G:{targetRgb.g} B:{targetRgb.b}
            </Text>
          </View>
        </View>
      </View>

      {/* Spectrum */}
      <View style={styles.spectrumContainer}>
        <ColorSpectrum height={300} onColorChange={handleColorChange} />
      </View>

      {/* Status */}
      <View style={styles.statusSection}>
        {matched ? (
          <View style={styles.matchContainer}>
            <Text style={styles.matchText}>MATCH!</Text>
            <Text style={styles.scoreText}>
              ACCURACY: {score}% | TIME: {elapsed.toFixed(1)}s
            </Text>
            <Text style={styles.streakCounter}>STREAK: {streak}</Text>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextText}>NEXT</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.meterContainer}>
            <View style={styles.meterRow}>
              <Text style={styles.meterLabel}>MATCH</Text>
              <Text style={styles.meterValue}>{distancePercent}%</Text>
            </View>
            <View style={styles.meterTrack}>
              <View
                style={[
                  styles.meterFill,
                  {
                    width: `${distancePercent}%`,
                    backgroundColor:
                      distancePercent > 80
                        ? THEME.textBright
                        : distancePercent > 50
                        ? "#ffaa00"
                        : THEME.accent,
                  },
                ]}
              />
            </View>
            <Text style={styles.timerText}>{elapsed.toFixed(1)}s</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
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
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.accent,
    marginBottom: 8,
  },
  title: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeLarge,
    color: THEME.textBright,
    textShadowColor: THEME.textBright,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  streakText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
  },
  targetSection: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  targetLabel: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    marginBottom: 8,
  },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  targetSwatch: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: THEME.border,
  },
  targetHex: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeLarge,
    color: "#ffffff",
  },
  targetRgb: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    marginTop: 2,
  },
  spectrumContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  statusSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  meterContainer: {},
  meterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  meterLabel: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
  },
  meterValue: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.text,
  },
  meterTrack: {
    height: 8,
    backgroundColor: THEME.bgSecondary,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 8,
  },
  meterFill: {
    height: "100%",
  },
  timerText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    textAlign: "right",
  },
  matchContainer: {
    alignItems: "center",
  },
  matchText: {
    fontFamily: THEME.fontFamily,
    fontSize: 24,
    color: THEME.textBright,
    textShadowColor: THEME.textBright,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    marginBottom: 8,
  },
  scoreText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.text,
    marginBottom: 4,
  },
  streakCounter: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.accent,
    marginBottom: 16,
  },
  nextButton: {
    borderWidth: 2,
    borderColor: THEME.accent,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  nextText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.accent,
  },
});
