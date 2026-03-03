import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
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
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={onBack} style={styles.backButtonContainer}>
            <Text style={styles.backButton}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>CHALLENGE</Text>
          <View style={styles.backButtonSpacer} />
        </View>
        <Text style={styles.subtitle}>
          {bestStreak > 0 ? `BEST:${bestStreak}` : "FIND THE COLOR"}
        </Text>
      </View>

      {/* Spectrum */}
      <View style={styles.spectrumContainer}>
        <ColorSpectrum height={340} onColorChange={handleColorChange} />
      </View>

      {/* Target */}
      <View style={styles.targetSection}>
        <View style={styles.targetRow}>
          <View style={[styles.targetSwatch, { backgroundColor: targetHex }]} />
          <View style={styles.targetInfo}>
            <Text style={styles.targetHex}>{targetHex}</Text>
            <Text style={styles.targetRgb}>
              R:{targetRgb.r} G:{targetRgb.g} B:{targetRgb.b}
            </Text>
          </View>
        </View>
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
                    backgroundColor: THEME.textDim,
                  },
                ]}
              />
            </View>
            <Text style={styles.timerText}>{elapsed.toFixed(1)}s</Text>
          </View>
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
  targetSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  targetInfo: {
    flex: 1,
    gap: 8,
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
    color: THEME.text,
  },
  targetRgb: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
  },
  spectrumContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  statusSection: {
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
    color: THEME.textDim,
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
    color: THEME.text,
    marginBottom: 8,
  },
  scoreText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    marginBottom: 4,
  },
  streakCounter: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    marginBottom: 16,
  },
  nextButton: {
    borderWidth: 2,
    borderColor: THEME.textDim,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  nextText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
  },
});
