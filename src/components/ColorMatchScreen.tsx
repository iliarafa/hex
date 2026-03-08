import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { THEME } from "../constants/theme";
import { playSound } from "../utils/sounds";

const GAME_DURATION = 45;

interface ColorMatchScreenProps {
  onBack: () => void;
}

const COLORS: { name: string; hex: string }[] = [
  { name: "RED", hex: "#FF4444" },
  { name: "BLUE", hex: "#4488FF" },
  { name: "GREEN", hex: "#44DD44" },
  { name: "YELLOW", hex: "#FFDD44" },
  { name: "ORANGE", hex: "#FF8844" },
  { name: "PURPLE", hex: "#CC44FF" },
];

interface Round {
  leftWord: string;
  rightWord: string;
  rightTextColor: string;
  answer: boolean;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRound(): Round {
  const leftColor = pickRandom(COLORS);
  const shouldMatch = Math.random() < 0.5;
  const rightTextColorEntry = shouldMatch
    ? leftColor
    : pickRandom(COLORS.filter((c) => c.name !== leftColor.name));

  // Right card word differs from its text color (Stroop effect)
  const rightWordOptions = COLORS.filter(
    (c) => c.name !== rightTextColorEntry.name
  );
  const rightWord = pickRandom(rightWordOptions);

  return {
    leftWord: leftColor.name,
    rightWord: rightWord.name,
    rightTextColor: rightTextColorEntry.hex,
    answer: shouldMatch,
  };
}

export const ColorMatchScreen: React.FC<ColorMatchScreenProps> = ({
  onBack,
}) => {
  const [round, setRound] = useState<Round>(() => generateRound());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [remaining, setRemaining] = useState(GAME_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!gameOver) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const left = GAME_DURATION - elapsed;
        if (left <= 0) {
          setRemaining(0);
          setGameOver(true);
          if (timerRef.current) clearInterval(timerRef.current);
          playSound("solved");
        } else {
          setRemaining(left);
        }
      }, 100);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [gameOver]);

  const handleAnswer = useCallback(
    (playerAnswer: boolean) => {
      if (gameOver) return;

      if (playerAnswer === round.answer) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        playSound("rowComplete");
        setScore((s) => s + 1);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      setRound(generateRound());
    },
    [gameOver, round.answer]
  );

  const startGame = useCallback(() => {
    setScore(0);
    setRound(generateRound());
    setGameOver(false);
    setRemaining(GAME_DURATION);
  }, []);

  const SWIPE_THRESHOLD = 50;
  const translateX = useSharedValue(0);

  const swipeGesture = Gesture.Pan()
    .onChange((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(handleAnswer)(true);
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        runOnJS(handleAnswer)(false);
      }
      translateX.value = withSpring(0);
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButtonContainer}>
          <Text style={styles.backButton}>{"<"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.upperArea}>
          <Text style={styles.title}>MATCH HEX</Text>
          <Text style={styles.question}>
            DOES THE MEANING{"\n"}MATCH THE TEXT COLOR?
          </Text>

          {!gameOver ? (
            <GestureDetector gesture={swipeGesture}>
              <Animated.View style={[animatedCardStyle, { width: "100%" }]}>
                <View style={styles.cardsRow}>
                  <View style={styles.card}>
                    <Text style={styles.cardWord}>{round.leftWord}</Text>
                    <Text style={styles.cardLabel}>MEANING</Text>
                  </View>

                  <View style={styles.card}>
                    <Text
                      style={[
                        styles.cardWord,
                        { color: round.rightTextColor },
                      ]}
                    >
                      {round.rightWord}
                    </Text>
                    <Text style={styles.cardLabel}>TEXT COLOR</Text>
                  </View>
                </View>
              </Animated.View>
            </GestureDetector>
          ) : (
            <View style={styles.cardsRow}>
              <View style={styles.card}>
                <Text style={styles.cardWord}>{round.leftWord}</Text>
                <Text style={styles.cardLabel}>MEANING</Text>
              </View>

              <View style={styles.card}>
                <Text
                  style={[styles.cardWord, { color: round.rightTextColor }]}
                >
                  {round.rightWord}
                </Text>
                <Text style={styles.cardLabel}>TEXT COLOR</Text>
              </View>
            </View>
          )}
        </View>

        {!gameOver && (
          <View style={styles.swipeHintArea}>
            <View style={styles.swipeHintRow}>
              <View style={styles.swipeIndicator}>
                <Text style={styles.swipeArrow}>{"<<"}</Text>
                <Text style={styles.swipeLabel}>NO</Text>
              </View>

              <Text style={styles.swipePrompt}>SWIPE</Text>

              <View style={styles.swipeIndicator}>
                <Text style={styles.swipeArrow}>{">>"}</Text>
                <Text style={styles.swipeLabel}>YES</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {gameOver ? (
          <View style={styles.gameOverContainer}>
            <Text style={styles.timeUpText}>TIME'S UP!</Text>
            <Text style={styles.scoreResult}>SCORE: {score}</Text>
            <TouchableOpacity style={styles.newGameButton} onPress={startGame}>
              <Text style={styles.newGameButtonText}>NEW GAME</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statsRow}>
            <Text style={styles.scoreLive}>SCORE: {score}</Text>
            <Text style={styles.timerText}>{remaining.toFixed(1)}s</Text>
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
  backButtonContainer: {
    width: 40,
  },
  backButton: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeXL,
    color: THEME.textDim,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  upperArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  swipeHintArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: THEME.fontFamily,
    fontSize: 24,
    color: THEME.text,
    textAlign: "center",
    textShadowColor: "rgba(255,255,255,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 24,
  },
  question: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 32,
  },
  swipeHintRow: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  swipeIndicator: {
    flex: 1,
    flexBasis: 0,
    alignItems: "center",
    gap: 6,
  },
  swipeArrow: {
    fontFamily: THEME.fontFamily,
    fontSize: 24,
    color: THEME.text,
  },
  swipeLabel: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeLarge,
    color: THEME.text,
  },
  swipePrompt: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 16,
  },
  card: {
    flex: 1,
    flexBasis: 0,
    backgroundColor: THEME.bgSecondary,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 32,
    alignItems: "center",
  },
  cardWord: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeXL,
    color: THEME.text,
    marginBottom: 16,
  },
  cardLabel: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  scoreLive: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.text,
  },
  timerText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
  },
  gameOverContainer: {
    alignItems: "center",
  },
  timeUpText: {
    fontFamily: THEME.fontFamily,
    fontSize: 24,
    color: THEME.accent,
    marginBottom: 4,
  },
  scoreResult: {
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
  newGameButtonText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.text,
  },
});
