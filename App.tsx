import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useFonts,
  PressStart2P_400Regular,
} from "@expo-google-fonts/press-start-2p";
import { LandingScreen } from "./src/components/LandingScreen";
import { ColorSpectrum } from "./src/components/ColorSpectrum";
import { HexDisplay } from "./src/components/HexDisplay";
import { ChallengeScreen } from "./src/components/ChallengeScreen";
import { THEME } from "./src/constants/theme";

export default function App() {
  const [fontsLoaded] = useFonts({ PressStart2P_400Regular });
  const [screen, setScreen] = useState<"landing" | "picker" | "challenge">("landing");
  const [hex, setHex] = useState("#00FF41");
  const [spectrumHeight, setSpectrumHeight] = useState(0);

  const handleColorChange = useCallback(
    (newHex: string, _h: number, _s: number, _l: number) => {
      setHex(newHex);
    },
    []
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: THEME.textBright }}>LOADING...</Text>
      </View>
    );
  }

  const renderScreen = () => {
    if (screen === "challenge") {
      return <ChallengeScreen onBack={() => setScreen("picker")} />;
    }

    return (
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => setScreen("landing")} style={styles.backButtonContainer}>
              <Text style={styles.backButton}>{"<"}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>HEX</Text>
            <View style={styles.backButtonSpacer} />
          </View>
          <Text style={styles.subtitle}>COLOR PICKER</Text>
        </View>

        {/* Spectrum */}
        <View
          style={styles.spectrumContainer}
          onLayout={(e) => setSpectrumHeight(e.nativeEvent.layout.height)}
        >
          {spectrumHeight > 0 && (
            <ColorSpectrum height={spectrumHeight} onColorChange={handleColorChange} />
          )}
        </View>

        {/* Result */}
        <HexDisplay hex={hex} />

        {/* Challenge link at bottom */}
        <TouchableOpacity
          onPress={() => setScreen("challenge")}
          style={styles.challengeLink}
        >
          <Text style={styles.challengeText}>CHALLENGE MODE &gt;</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />
        {screen === "landing" ? null : renderScreen()}
      </SafeAreaView>
      {screen === "landing" && (
        <View style={StyleSheet.absoluteFill}>
          <LandingScreen onStart={() => setScreen("picker")} />
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  loading: {
    flex: 1,
    backgroundColor: THEME.bg,
    justifyContent: "center",
    alignItems: "center",
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
    marginTop: 4,
    textAlign: "center",
  },
  spectrumContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  challengeLink: {
    alignItems: "center",
    paddingVertical: 12,
  },
  challengeText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
  },
});
