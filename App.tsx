import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform, useWindowDimensions } from "react-native";
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
import { ModeSelectScreen } from "./src/components/ModeSelectScreen";
import { EnterHexScreen } from "./src/components/EnterHexScreen";
import { ColorMatchScreen } from "./src/components/ColorMatchScreen";
import { SettingsScreen } from "./src/components/SettingsScreen";
import { FavoritesScreen } from "./src/components/FavoritesScreen";
import { DrawHexGalleryScreen } from "./src/components/DrawHexGalleryScreen";
import { DrawHexEditorScreen } from "./src/components/DrawHexEditorScreen";
import { FavoritesProvider } from "./src/context/FavoritesContext";
import { DrawingsProvider } from "./src/context/DrawingsContext";
import { THEME } from "./src/constants/theme";
import { AppShell, useIsDesktop } from "./src/components/AppShell";
import { DesktopNav, type DesktopMode } from "./src/components/DesktopNav";
import { useBackHandler } from "./src/utils/backHandler";
import { dismissWebBoot } from "./src/utils/webShell";
import { shouldLockStage } from "./src/utils/enterLayout";

export default function App() {
  const [fontsLoaded] = useFonts({ PressStart2P_400Regular });
  const [screen, setScreen] = useState<
    | "landing"
    | "mode"
    | "picker"
    | "challenge"
    | "enterHex"
    | "colorMatch"
    | "settings"
    | "favorites"
    | "drawHexGallery"
    | "drawHexEditor"
  >("landing");
  const [hex, setHex] = useState("#00FF41");
  const [spectrumBox, setSpectrumBox] = useState({ width: 0, height: 0 });
  const [editingDrawingId, setEditingDrawingId] = useState<string | null>(null);
  const desktop = useIsDesktop();
  const windowSize = useWindowDimensions();
  const lockStage = shouldLockStage(Platform.OS, screen, windowSize.width, windowSize.height);
  const settingsFrom = useRef<typeof screen>("picker");

  const handleColorChange = useCallback(
    (newHex: string, _h: number, _s: number, _l: number) => {
      setHex(newHex);
    },
    []
  );

  useEffect(() => {
    if (Platform.OS === "web") dismissWebBoot();
  }, []);

  const openMode = useCallback((mode: DesktopMode) => {
    if (mode === "picker") setScreen("picker");
    else if (mode === "enterHex") setScreen("enterHex");
    else if (mode === "colorMatch") setScreen("colorMatch");
    else if (mode === "favorites") setScreen("favorites");
    else if (mode === "drawHex") setScreen("drawHexGallery");
    else setScreen("challenge");
  }, []);

  const openSettings = useCallback(() => {
    setScreen((current) => {
      if (current !== "settings" && current !== "landing") {
        settingsFrom.current = current;
      }
      return "settings";
    });
  }, []);

  useBackHandler(0, screen !== "landing", () => {
    if (screen === "drawHexEditor") {
      setEditingDrawingId(null);
      setScreen("drawHexGallery");
      return;
    }
    if (desktop) {
      if (screen === "settings") setScreen(settingsFrom.current);
      return;
    }
    if (screen === "mode") {
      setScreen("landing");
      return;
    }
    setScreen("mode");
  });

  useEffect(() => {
    if (!desktop) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (screen === "landing") {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setScreen("picker");
        }
        return;
      }
      const index = Number(event.key);
      if (index >= 1 && index <= 6) {
        event.preventDefault();
        const order: DesktopMode[] = [
          "picker",
          "enterHex",
          "drawHex",
          "challenge",
          "colorMatch",
          "favorites",
        ];
        openMode(order[index - 1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [desktop, screen, openMode]);

  if (!fontsLoaded) {
    return (
      <AppShell>
        <View style={styles.loading}>
          <Text style={{ color: THEME.textBright }}>LOADING...</Text>
        </View>
      </AppShell>
    );
  }

  const renderScreen = () => {
    if (screen === "mode" && !desktop) {
      return (
        <ModeSelectScreen
          onBack={() => setScreen("landing")}
          onSettings={openSettings}
          onSelect={(mode) => {
            if (mode === "picker") {
              setScreen("picker");
            } else if (mode === "enterHex") {
              setScreen("enterHex");
            } else if (mode === "colorMatch") {
              setScreen("colorMatch");
            } else if (mode === "favorites") {
              setScreen("favorites");
            } else if (mode === "drawHex") {
              setScreen("drawHexGallery");
            } else {
              setScreen("challenge");
            }
          }}
        />
      );
    }

    if (screen === "settings") {
      return (
        <SettingsScreen
          onBack={() => setScreen(desktop ? settingsFrom.current : "mode")}
        />
      );
    }

    if (screen === "enterHex") {
      return <EnterHexScreen onBack={() => setScreen("mode")} />;
    }

    if (screen === "colorMatch") {
      return <ColorMatchScreen onBack={() => setScreen("mode")} />;
    }

    if (screen === "challenge") {
      return <ChallengeScreen onBack={() => setScreen("mode")} />;
    }

    if (screen === "favorites") {
      return <FavoritesScreen onBack={() => setScreen("mode")} />;
    }

    if (screen === "drawHexGallery") {
      return (
        <DrawHexGalleryScreen
          onBack={() => setScreen("mode")}
          onOpenDrawing={(id) => {
            setEditingDrawingId(id);
            setScreen("drawHexEditor");
          }}
        />
      );
    }

    if (screen === "drawHexEditor" && editingDrawingId) {
      return (
        <DrawHexEditorScreen
          drawingId={editingDrawingId}
          onBack={() => {
            setEditingDrawingId(null);
            setScreen("drawHexGallery");
          }}
        />
      );
    }

    const spectrum = (
      <View
        style={[styles.spectrumContainer, desktop && styles.spectrumDesktop]}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setSpectrumBox((prev) =>
            prev.width === width && prev.height === height ? prev : { width, height }
          );
        }}
      >
        {spectrumBox.width > 0 && spectrumBox.height > 0 && (
          <ColorSpectrum
            width={spectrumBox.width}
            height={spectrumBox.height}
            onColorChange={handleColorChange}
          />
        )}
      </View>
    );

    if (desktop) {
      return (
        <View style={styles.desktopBrowse}>
          {spectrum}
          <HexDisplay hex={hex} layout="panel" />
        </View>
      );
    }

    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => setScreen("mode")} style={styles.backButtonContainer}>
              <Text style={styles.backButton}>{"<"}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>HEX</Text>
            <View style={styles.backButtonSpacer} />
          </View>
          <Text style={styles.subtitle}>COLOR PICKER</Text>
        </View>
        {spectrum}
        <HexDisplay hex={hex} />
      </View>
    );
  };

  const desktopActive = (): DesktopMode | "settings" | "drawHexEditor" | "drawHexGallery" => {
    if (screen === "enterHex") return "enterHex";
    if (screen === "challenge") return "challenge";
    if (screen === "colorMatch") return "colorMatch";
    if (screen === "favorites") return "favorites";
    if (screen === "drawHexGallery") return "drawHexGallery";
    if (screen === "drawHexEditor") return "drawHexEditor";
    if (screen === "settings") return "settings";
    if (screen === "mode") return "picker";
    return "picker";
  };

  return (
    <AppShell lockStage={lockStage}>
    <FavoritesProvider>
      <DrawingsProvider>
        <GestureHandlerRootView style={styles.root}>
          <SafeAreaView style={styles.root}>
            <StatusBar style="light" />
            {desktop && screen !== "landing" ? (
              <View style={styles.workstation}>
                <DesktopNav
                  active={desktopActive()}
                  onSelect={openMode}
                  onSettings={openSettings}
                />
                <View style={styles.workstationMain}>{renderScreen()}</View>
              </View>
            ) : screen === "landing" ? null : (
              renderScreen()
            )}
            {screen === "landing" && (
              <View style={StyleSheet.absoluteFill}>
                <LandingScreen onStart={() => setScreen(desktop ? "picker" : "mode")} />
              </View>
            )}
          </SafeAreaView>
        </GestureHandlerRootView>
      </DrawingsProvider>
    </FavoritesProvider>
    </AppShell>
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
  spectrumDesktop: {
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  desktopBrowse: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: THEME.bg,
  },
  workstation: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: THEME.bg,
  },
  workstationMain: {
    flex: 1,
    minWidth: 0,
  },
});
