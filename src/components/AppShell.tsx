import React, { createContext, useContext, useState } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { THEME } from "../constants/theme";

/** Wide web viewports get the desktop workstation. Phones and native stay stacked. */
export const DESKTOP_MIN_WIDTH = 1024;

type Viewport = { width: number; height: number };

const ViewportContext = createContext<Viewport>({ width: 0, height: 0 });

export function useAppViewport(): Viewport {
  const measured = useContext(ViewportContext);
  const windowSize = useWindowDimensions();
  if (measured.width > 0 && measured.height > 0) return measured;
  return { width: windowSize.width, height: windowSize.height };
}

export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && width >= DESKTOP_MIN_WIDTH;
}

/** Full-bleed shell. Desktop layout lives in the screens, not in a phone frame. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const windowSize = useWindowDimensions();
  const [size, setSize] = useState<Viewport>({
    width: windowSize.width,
    height: windowSize.height,
  });

  return (
    <View
      style={styles.fill}
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
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
});
