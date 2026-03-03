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
import { THEME } from "./src/constants/theme";

export default function App() {
  const [fontsLoaded] = useFonts({ PressStart2P_400Regular });
  const [screen, setScreen] = useState<"landing" | "picker">("landing");
  const [hex, setHex] = useState("#00FF41");

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

  if (screen === "landing") {
    return (
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="light" />
        <LandingScreen onStart={() => setScreen("picker")} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen("landing")}>
            <Text style={styles.backButton}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>HEX</Text>
          <Text style={styles.subtitle}>COLOR PICKER</Text>
        </View>

        {/* Spectrum */}
        <View style={styles.spectrumContainer}>
          <ColorSpectrum height={380} onColorChange={handleColorChange} />
        </View>

        {/* Result */}
        <HexDisplay hex={hex} />
      </SafeAreaView>
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
  title: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeXL,
    color: THEME.textBright,
    textShadowColor: THEME.textBright,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    marginTop: 4,
  },
  backButton: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.accent,
    marginBottom: 8,
  },
  spectrumContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
});
