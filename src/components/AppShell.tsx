import React, { createContext, useContext, useState } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { THEME } from "../constants/theme";

const FRAME_BREAKPOINT = 720;
const FRAME_WIDTH = 390;
const FRAME_MAX_HEIGHT = 844;

type Viewport = { width: number; height: number };

const ViewportContext = createContext<Viewport>({ width: 0, height: 0 });

export function useAppViewport(): Viewport {
  const measured = useContext(ViewportContext);
  const window = useWindowDimensions();
  if (measured.width > 0 && measured.height > 0) return measured;
  return { width: window.width, height: window.height };
}

function frameHeight(windowHeight: number) {
  return Math.min(FRAME_MAX_HEIGHT, Math.max(480, windowHeight - 48));
}

/**
 * On a wide browser, center the app in a phone-shaped column so the CRT layout
 * stays the same as on iOS. Narrow viewports (phones) stay full-bleed.
 * Native builds are unchanged.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const window = useWindowDimensions();
  const framed = Platform.OS === "web" && window.width >= FRAME_BREAKPOINT;
  const [size, setSize] = useState<Viewport>(() =>
    framed
      ? { width: FRAME_WIDTH, height: frameHeight(window.height) }
      : { width: window.width, height: window.height }
  );

  const deviceHeight = framed ? frameHeight(window.height) : undefined;

  return (
    <View style={framed ? styles.stage : styles.fill}>
      <View style={framed ? [styles.bezel, { height: (deviceHeight ?? 0) + 2 }] : styles.fill}>
        <View
          style={framed ? [styles.device, { height: deviceHeight }] : styles.fill}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            if (width <= 0 || height <= 0) return;
            setSize((prev) =>
              prev.width === width && prev.height === height ? prev : { width, height }
            );
          }}
        >
          <ViewportContext.Provider value={size}>{children}</ViewportContext.Provider>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  stage: {
    flex: 1,
    backgroundColor: THEME.stage,
    alignItems: "center",
    justifyContent: "center",
  },
  bezel: {
    width: FRAME_WIDTH + 2,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.bg,
  },
  device: {
    width: FRAME_WIDTH,
    overflow: "hidden",
    backgroundColor: THEME.bg,
  },
});
